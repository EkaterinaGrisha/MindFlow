#!/usr/bin/env python3
"""
Mentor quality benchmark for MindFlow.

Reads tests/llm/benchmark_questions.csv, calls /api/llm/respond for each question,
then checks:
  - Are expected key concepts mentioned?
  - Are citations present ([1], [2], …) when expected?
  - Does the response contain obvious hallucination signals?

Usage:
  python3 tests/llm/mentor_benchmark.py
  python3 tests/llm/mentor_benchmark.py --api-url http://localhost:8787
  python3 tests/llm/mentor_benchmark.py --output tests/llm/benchmark_report.md
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import statistics
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import TypedDict

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package not found. Run: pip3 install requests")
    sys.exit(1)

# ── Types ──────────────────────────────────────────────────────────────────────

class Question(TypedDict):
    id: str
    question: str
    role: str
    expected_concepts: list[str]
    expect_citation: bool
    notes: str

class Result(TypedDict):
    id: str
    question: str
    role: str
    notes: str
    response: str
    raw_payload: dict
    citations_from_rag: list[dict]
    retrieved_chunks: list[dict]
    concepts_found: list[str]
    concepts_missing: list[str]
    concept_coverage: float
    role_weighted_score: float
    citation_expected: bool
    citation_found: bool
    hallucination_flags: list[str]
    role_checks: dict
    passed: bool
    latency_ms: float
    error: str | None

# ── Hallucination detection ────────────────────────────────────────────────────

# Phrases that suggest the model is inventing sources or facts
HALLUCINATION_PATTERNS = [
    r"по данным [Аа]нтропик",
    r"согласно [Оо]пенAI",
    r"[Уу]чебник [Пп]ушкина",
    r"источник №\d+ не найден",
    r"я не имею доступа к учебнику",
    r"как сказано в \[источник\]",
    r"ISBN \d{10,13}",          # hallucinated book references
]

CITATION_RE = re.compile(r"\[\d+\]")

def has_citations(text: str) -> bool:
    return bool(CITATION_RE.search(text))

def check_hallucinations(text: str) -> list[str]:
    flags = []
    for pattern in HALLUCINATION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            flags.append(pattern)
    return flags

def concepts_in_response(response_lower: str, concepts: list[str]) -> tuple[list[str], list[str]]:
    """Match each expected concept against the response.

    A concept is considered found if either:
      - the concept string itself appears as a substring, OR
      - any of its registered synonyms appears as a substring.

    Synonyms cover three common gaps revealed by the v1 baseline:
      1. RU/EN twin terms ("след" / "trace", "собственное значение" / "eigenvalue")
      2. Phrasings that students/mentors use interchangeably
         ("согласованность размерностей" ↔ "внутренняя размерность совпадает")
      3. Concept families ("мультиколлинеарность" ↔ "линейная зависимость столбцов")
    """
    found = []
    missing = []
    for concept in concepts:
        c_lc = concept.lower()
        synonyms = CONCEPT_SYNONYMS.get(c_lc, ())
        if c_lc in response_lower or any(s in response_lower for s in synonyms):
            found.append(concept)
        else:
            missing.append(concept)
    return found, missing


# Synonym map: lowercased canonical concept → tuple of lowercased alternative phrasings.
# Add entries here whenever a benchmark response is correctly using a concept under
# a different name. Keep entries narrow to avoid false positives.
CONCEPT_SYNONYMS: dict[str, tuple[str, ...]] = {
    # Q01 — matrix definition (v2 sanity additions)
    "размерность": (
        "размер.{0,5}матриц",
        "числ.{0,5}строк.{0,15}и.{0,15}числ.{0,5}столбц",
        "m.{0,3}\\\\?times.{0,3}n",
        "m.{0,3}×.{0,3}n",
        "m\\s*на\\s*n",
        "размер задаётся",
    ),
    # Q02 — matrix multiplication
    "согласованность размерностей": (
        "внутренняя размерность",
        "внутренние размерности",
        "размерности должны совпадать",
        "число столбцов первой",
        "числ.{0,5}столбц.{0,40}числ.{0,5}строк",
        "столбц.{0,40}равн.{0,40}строк",
    ),
    "строка на столбец": ("строки первой", "строку первой", "i-ю строку", "i-й строки"),
    "скалярное произведение": ("сумм[аы] произведений", "перемножаем соответствующие"),
    # Q03 — determinant (площадь is the 2D geometric meaning; model usually
    # talks about volume/parallelepiped which covers the same idea)
    "площадь": (
        "площад",
        "ad\\s*-\\s*bc",
        "параллелограмм",
        "квадрат.{0,15}построенн",
    ),
    # Q04 — inverse
    "невырожденная": ("обратима", "обратимой", "не равен нулю", "det.{0,5}\\neq", "det.{0,5}≠"),
    "единичная матрица": ("единичную", "$e$", "матрица $i$", "= e\\b"),
    # Q03 — determinant (also covers short adj "вырождена" via "вырожден")
    "вырожденная матрица": ("вырожден", "схлопывает", "сплющил", "необратим"),
    "объём": ("параллелепипед", "n-мерн"),
    # Q05 — eigen
    "eigenvalue": ("собственное значение", "собственные значения"),
    # Q06 — Gauss
    "элементарные преобразования": ("разрешённых действия", "элементарны", "перестав", "прибавлять к"),
    "ступенчатый вид": ("ступенчат", "лесенк", "треугольн"),
    # Q07 — rank
    "линейная независимость": ("линейно независим", "не выражается через", "уникальн"),
    "подпространство": (
        "натянутое",
        "линейная оболочка",
        "span",
        "пространств.{0,5}строк",
        "пространств.{0,5}столбц",
        "пространство решен",
    ),
    # Q08 — PCA (снижение размерности is a DS-specific phrasing)
    "снижение размерности": (
        "снижен.{0,5}размерн",
        "уменьш.{0,5}размерн",
        "понижен.{0,5}размерн",
        "сжать данные",
        "сжимать данные",
        "сжатие данных",
        "редукция размерности",
        "сократ.{0,5}размерн",
    ),
    # Q09 — norms (евклидова норма is the canonical name for L2)
    "евклидова норма": (
        "евклид",
        "l2.?норм",
        "l_2",
        "теорема пифагора",
        "школьн.{0,5}длин",
        "обычн.{0,5}длин.{0,15}вектор",
    ),
    # Q10 — trace
    "trace": ("след", "tr(", "\\operatorname{tr}"),
    "диагональные элементы": ("главной диагонали", "на диагонали", "a_{ii}"),
    # Q11 — det of sum
    "линейность": ("полилинейн", "линейн.{0,15}по строкам", "линейн.{0,15}по столбцам"),
    "мультилинейность": ("полилинейн", "мультилинейн"),
    # Q12 — zero divisors
    "делитель нуля": ("делител.{0,3} нул", "ненулев.{0,5} матриц.{0,15} произведение"),
    "сингулярная матрица": ("вырожденн", "ранг.{0,15}меньше", "не обратим"),
    # Q13 — det of transpose
    "det(a^t) = det(a)": ("det.{0,5}a.{0,5}\\^?t", "транспонировани.{0,30}не меняет"),
    # Q14 — det=0 misconception
    "несовместная система": ("несовместн", "нет решений"),
    "бесконечно много решений": ("бесконечн.{0,5} решен", "бесконечное множество"),
    # Q14 — ranges in challenger contexts (краткое "ранг" — точное слово)
    "ранг": ("ранг", "rank", "rk\\("),
    # Q15 — rank-deficient regression
    "мультиколлинеарность": ("мультиколлинеар", "линейно зависим.{0,30}признак", "коллинеар"),
    "линейная зависимость": ("линейно зависим", "выражается через"),
    "регрессия": ("регресси", "ols", "мнк"),
    "переобучение": ("переобуч", "overfit"),
    # Q16 — rotation
    "матрица поворота": ("поворот", "rotation"),
    "ортогональная матрица": ("ортогональн", "a\\^t.{0,5}a.{0,5}=.{0,5}e", "сохраняет.{0,15}длин"),
    "геометрическое преобразование": ("геометрическ", "поворот", "отражени"),
    "транспонирование": ("транспонир", "a\\^t", "a\\^\\\\top"),
    # Q17 — sparse matrices
    "разреженная матрица": ("разреженн", "sparse", "csr", "csc"),
    "svd": ("сингулярн.{0,5} разложен", "singular value"),
    "матричное разложение": ("матричн.{0,5} разложен", "факториз"),
    "факторизация": ("факториз", "разложен"),
    # Q18 — neural net dims
    "матричное умножение": ("умножени.{0,15} матриц", "@", "·"),
    "batch": ("батч", "мини-батч", "мини батч", "32×128", "размер батча"),
    "forward pass": ("прямой проход", "прямое распространен", "forward", "предсказан.{0,15}через"),
    # Q19 — basis vs coords
    "система координат": ("систем.{0,5} координат", "координат.{0,5} оси"),
    "координаты вектора": ("координат.{0,5} вектора", "разложение по базису"),
    "порождающее множество": ("порождающ", "натягивают", "span", "линейная оболочка"),
    # Q20 — SVD vs PCA
    "сингулярное разложение": ("сингулярн.{0,5} разложен", "singular value"),
    "главные компоненты": ("главн.{0,5} компонент", "principal component"),
    "ковариационная матрица": ("ковариаци", "x\\^?t.{0,3}x"),
    "связь и различие": ("связ.{0,15}различ", "сходств.{0,15}различ", "общее.{0,15}разное"),
}


def _synonym_matches(text: str, pattern: str) -> bool:
    """Synonyms may be regex (containing meta-chars) or plain substring.
    Plain substrings are matched literally (case-insensitive); patterns with
    regex chars get full re.search treatment.
    """
    has_regex_chars = any(ch in pattern for ch in ".\\[](){}^$+*?|")
    if has_regex_chars:
        return bool(re.search(pattern, text, re.IGNORECASE))
    return pattern in text


# Override concepts_in_response to use the regex-aware matcher. The simple
# string version above is kept readable; this one is what runs in production.
def concepts_in_response(response_lower: str, concepts: list[str]) -> tuple[list[str], list[str]]:  # noqa: F811
    found: list[str] = []
    missing: list[str] = []
    for concept in concepts:
        c_lc = concept.lower()
        if c_lc in response_lower:
            found.append(concept)
            continue
        synonyms = CONCEPT_SYNONYMS.get(c_lc, ())
        if any(_synonym_matches(response_lower, s) for s in synonyms):
            found.append(concept)
        else:
            missing.append(concept)
    return found, missing

# ── Role-specific pedagogical checks ──────────────────────────────────────────
# LECTURER expects breadth of concepts + citations.
# MIRROR is Socratic: should ask a question, not deliver answers.
# SANDBOX should pose a scenario + open-ended micro-task, not solve it.
# CHALLENGER should bring a counter-example and probe the student's claim.

SPOILER_PATTERNS = [
    r"\bответ[:：]",
    r"\bправильный ответ\b",
    r"\bрешение[:：]",
    r"\bитак,?\s+ответ\b",
]
COUNTEREXAMPLE_RE = re.compile(
    r"контрприм|counterexample|против\s+пример|"
    r"возьм[иё]\s+матриц|возьм[иё]\s+вектор|"  # "возьми матрицу A = ..."
    r"например[,:]?\s+(?:если\s+)?[a-zа-я]\s*=",
    re.IGNORECASE,
)

# Scenario triggers: "ты — ML-инженер", "представь", "загрузил/настроил/запустил
# датасет/модель", direct second-person work-context openings ("ты работаешь в...",
# "ты пришёл с задачей...", "ты — аналитик в стартапе").
SCENARIO_RE = re.compile(
    r"\b("
    r"представ[ьи]|допусти[мт]|вообрази|"
    r"ты\s+(?:—|–|-)\s*\w+|"  # "ты — инженер", "ты — аналитик", "ты — ML-инженер"
    r"ml[-\s]?инженер|data\s*scientist|аналитик\s+данных|"
    r"ты\s+(?:залил|загрузил|настроил|запустил|открыл|обуча|строишь|пришёл|работаешь)|"
    r"датасет|сценар|задача\s+из\s+(?:реальной|практ)|на\s+проде|в\s+стартапе|в\s+проекте"
    r")",
    re.IGNORECASE,
)

# Imperative task verbs — when the mentor poses an open task without a literal
# question mark. "Запиши матрицу...", "Посчитай...", "Найди...", "Объясни...".
IMPERATIVE_TASK_RE = re.compile(
    r"\b("
    r"запиши|посчитай|вычисли|найди|объясни|докажи|"
    r"приведи|покажи|реши|сравни|оцени|выпиши|"
    r"подумай|попробуй|попытайся|сформулируй|разбери|"
    r"проверь|оцени|предложи|опиши|выбери|"
    r"назови|дай(?:\s+определение)?|сделай|построй|нарисуй"
    r")\b",
    re.IGNORECASE,
)


def _has_open_question_or_task(text: str) -> bool:
    """A '?' or any imperative task verb counts as an open invitation to the student."""
    if "?" in text:
        return True
    return bool(IMPERATIVE_TASK_RE.search(text))


def evaluate_role_specific(role: str, text: str) -> dict:
    """Return per-role pedagogical heuristics. All booleans + reasoning."""
    text_lc = text.lower()
    checks: dict = {}

    if role == "MIRROR":
        # Should invite the student in (a literal question or an imperative
        # like "сформулируй", "попробуй") rather than deliver facts.
        checks["asks_question"] = _has_open_question_or_task(text)
        checks["no_spoiler"] = not any(
            re.search(p, text_lc) for p in SPOILER_PATTERNS
        )

    elif role == "SANDBOX":
        # Should set a scenario AND pose a task (literal "?" or imperative).
        checks["has_scenario"] = bool(SCENARIO_RE.search(text))
        checks["has_open_task"] = _has_open_question_or_task(text) or "задач" in text_lc
        checks["no_spoiler"] = not any(
            re.search(p, text_lc) for p in SPOILER_PATTERNS
        )

    elif role == "CHALLENGER":
        # Should contain a counter-example and probe the student's reasoning.
        # Probing can be a question ("почему ты так думаешь?") OR a sharp
        # imperative challenge ("назови контрпример", "докажи строго").
        checks["has_counterexample"] = bool(COUNTEREXAMPLE_RE.search(text))
        checks["probes_student"] = _has_open_question_or_task(text)

    # LECTURER has no extra role-checks: concept coverage + citation is its own rubric.
    return checks


def role_check_passed(role: str, checks: dict) -> bool:
    """Whether all role-specific checks are satisfied (vacuously true for LECTURER)."""
    if role == "LECTURER" or not checks:
        return True
    return all(bool(v) for v in checks.values())


# Role-weighted scoring: concept_coverage means different things per role.
# LECTURER/CHALLENGER are expected to cover concepts; MIRROR is Socratic and
# must NOT spoon-feed concepts; SANDBOX should set a scenario with an open task.
# Treating all roles with the same coverage rubric structurally penalises MIRROR
# and SANDBOX even when they behave correctly. This function returns a [0,1]
# headline score that respects each role's actual purpose.
def role_weighted_score(role: str, coverage: float, role_checks: dict) -> float:
    if role in ("LECTURER", "CHALLENGER"):
        return coverage
    if role == "MIRROR":
        asks = 1.0 if role_checks.get("asks_question") else 0.0
        return 0.3 * coverage + 0.7 * asks
    if role == "SANDBOX":
        scenario = 1.0 if role_checks.get("has_scenario") else 0.0
        open_task = 1.0 if role_checks.get("has_open_task") else 0.0
        return 0.4 * coverage + 0.6 * (scenario + open_task) / 2.0
    return coverage

# ── API call ──────────────────────────────────────────────────────────────────

def call_mentor(
    api_url: str,
    question: str,
    role: str,
    retries: int = 3,
    debug_chunks: bool = False,
) -> tuple[str, dict, str | None, float]:
    """Returns (answer_text, raw_payload_dict, error_message, latency_ms).

    The API responds with {role, answer, rag, ...}. We return the textual
    `answer` for downstream analysis and the full dict for traceability.

    latency_ms is wall-clock time of the successful POST (or the final failing
    attempt if all retries error out). Use this as the single source of truth
    for benchmark latency — Supabase events.latency_ms is noisier (front-end
    telemetry mixed in).
    """
    payload = {
        "user_input": question,
        "current_topic": "Линейная алгебра",
        "current_page": "теория",
        "level": "средний",
        "experience": "студент DS",
        "interests": "машинное обучение",
        "recent_topics": "",
        "mastered_concepts": "",
        "weak_concepts": "",
        "knowledge_graph_summary": "",
        "retrieved_theory": "",
        "force_role": role,
    }

    url = f"{api_url}/api/llm/respond" + ("?debug=1" if debug_chunks else "")

    last_latency_ms = 0.0
    for attempt in range(retries):
        t0 = time.perf_counter()
        try:
            resp = requests.post(url, json=payload, timeout=1800)
            last_latency_ms = (time.perf_counter() - t0) * 1000.0
            if resp.status_code == 200:
                data = resp.json()
                answer = data.get("answer") or data.get("response") or ""
                return answer, data, None, last_latency_ms
            else:
                error = f"HTTP {resp.status_code}: {resp.text[:200]}"
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                return "", {}, error, last_latency_ms
        except requests.exceptions.ConnectionError:
            last_latency_ms = (time.perf_counter() - t0) * 1000.0
            error = f"Connection refused at {api_url}. Is the API running? (npm run dev:api)"
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            return "", {}, error, last_latency_ms
        except Exception as e:
            last_latency_ms = (time.perf_counter() - t0) * 1000.0
            error = str(e)
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            return "", {}, error, last_latency_ms

    return "", {}, "Max retries exceeded", last_latency_ms

# ── Load questions ─────────────────────────────────────────────────────────────

def load_questions(csv_path: Path) -> list[Question]:
    questions: list[Question] = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            concepts_raw = row.get("expected_concepts", "")
            questions.append({
                "id": row["id"].strip(),
                "question": row["question"].strip(),
                "role": row["role"].strip(),
                "expected_concepts": [c.strip() for c in concepts_raw.split(",") if c.strip()],
                "expect_citation": row.get("expect_citation", "false").strip().lower() == "true",
                "notes": row.get("notes", "").strip(),
            })
    return questions

# ── Run benchmark ─────────────────────────────────────────────────────────────

def run_benchmark(
    api_url: str,
    questions: list[Question],
    delay: float = 1.0,
    debug_chunks: bool = False,
) -> list[Result]:
    results: list[Result] = []

    for i, q in enumerate(questions, 1):
        print(f"  [{i:02d}/{len(questions)}] {q['id']} ({q['role']}) — {q['question'][:60]}…", end=" ", flush=True)

        answer, raw, error, latency_ms = call_mentor(
            api_url, q["question"], q["role"], debug_chunks=debug_chunks
        )

        if error:
            print(f"ERROR: {error}")
            results.append({
                "id": q["id"],
                "question": q["question"],
                "role": q["role"],
                "notes": q["notes"],
                "response": "",
                "raw_payload": {},
                "citations_from_rag": [],
                "retrieved_chunks": [],
                "concepts_found": [],
                "concepts_missing": q["expected_concepts"],
                "concept_coverage": 0.0,
                "role_weighted_score": 0.0,
                "citation_expected": q["expect_citation"],
                "citation_found": False,
                "hallucination_flags": [],
                "role_checks": {},
                "passed": False,
                "latency_ms": latency_ms,
                "error": error,
            })
            continue

        answer_lower = answer.lower()
        found, missing = concepts_in_response(answer_lower, q["expected_concepts"])
        coverage = len(found) / len(q["expected_concepts"]) if q["expected_concepts"] else 1.0

        # Citation evidence: prefer structured RAG citations; fall back to inline [N] regex
        rag_block = raw.get("rag") or {}
        rag_citations = rag_block.get("citations") or []
        # When MENTOR_DEBUG_CHUNKS=1 or ?debug=1 was honoured by the API,
        # sourcesUsed[*].text is populated. Stored for the faithfulness judge.
        retrieved_chunks = rag_block.get("sourcesUsed") or []
        citation_found = bool(rag_citations) or has_citations(answer)

        hallucination_flags = check_hallucinations(answer)
        role_checks = evaluate_role_specific(q["role"], answer)
        rw_score = role_weighted_score(q["role"], coverage, role_checks)

        citation_ok = (not q["expect_citation"]) or citation_found
        role_ok = role_check_passed(q["role"], role_checks)

        # Pass policy per role:
        #  - LECTURER: ≥50% concept coverage + citation when expected + no hallucination
        #  - MIRROR / SANDBOX / CHALLENGER: role-specific checks + no hallucination;
        #    concept coverage is informational only (they aren't supposed to expose answers).
        if q["role"] == "LECTURER":
            passed = coverage >= 0.5 and citation_ok and not hallucination_flags
        else:
            passed = role_ok and citation_ok and not hallucination_flags

        status = "✓" if passed else "✗"
        role_summary = " ".join(f"{k}={'✓' if v else '✗'}" for k, v in role_checks.items())
        print(
            f"{status} cov={coverage:.0%} rw={rw_score:.0%} cite={'✓' if citation_found else '✗'} {latency_ms:.0f}ms"
            + (f"  {role_summary}" if role_summary else "")
        )

        results.append({
            "id": q["id"],
            "question": q["question"],
            "role": q["role"],
            "notes": q["notes"],
            "response": answer,
            "raw_payload": raw,
            "citations_from_rag": rag_citations,
            "retrieved_chunks": retrieved_chunks,
            "concepts_found": found,
            "concepts_missing": missing,
            "concept_coverage": coverage,
            "role_weighted_score": rw_score,
            "citation_expected": q["expect_citation"],
            "citation_found": citation_found,
            "hallucination_flags": hallucination_flags,
            "role_checks": role_checks,
            "passed": passed,
            "latency_ms": latency_ms,
            "error": None,
        })

        if delay > 0:
            time.sleep(delay)

    return results

# ── Generate report ───────────────────────────────────────────────────────────

def _percentiles(values: list[float]) -> dict[str, float]:
    """Return p50/p95/p99 (ms). Returns zeros if input is empty.

    Uses simple percentile-of-sorted-values; for n=20 this is accurate enough
    without numpy. statistics.quantiles is awkward for arbitrary percentiles,
    so we compute manually.
    """
    if not values:
        return {"p50": 0.0, "p95": 0.0, "p99": 0.0}
    s = sorted(values)
    n = len(s)

    def pct(p: float) -> float:
        # nearest-rank method, clamped
        k = max(0, min(n - 1, int(round(p / 100.0 * (n - 1)))))
        return s[k]

    return {"p50": pct(50), "p95": pct(95), "p99": pct(99)}


def generate_report(results: list[Result], api_url: str) -> str:
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    errors = sum(1 for r in results if r["error"])
    citations_expected = [r for r in results if r["citation_expected"]]
    citations_ok = sum(1 for r in citations_expected if r["citation_found"])

    ok_results = [r for r in results if not r["error"]]
    avg_coverage = (
        sum(r["concept_coverage"] for r in ok_results) / max(len(ok_results), 1)
    )
    avg_rw = (
        sum(r["role_weighted_score"] for r in ok_results) / max(len(ok_results), 1)
    )

    latency_overall = _percentiles([r["latency_ms"] for r in ok_results])

    hallucinated = [r for r in results if r["hallucination_flags"]]

    by_role: dict[str, list[Result]] = {}
    for r in results:
        by_role.setdefault(r["role"], []).append(r)

    lines = [
        f"# Mentor Benchmark Report",
        f"",
        f"**Дата:** {datetime.now().strftime('%Y-%m-%d %H:%M')}  ",
        f"**API:** {api_url}  ",
        f"**Всего вопросов:** {total}",
        f"",
        f"## Итог",
        f"",
        f"| Метрика | Значение |",
        f"|---|---|",
        f"| Пройдено | {passed}/{total} ({passed/total:.0%}) |",
        f"| Role-weighted score (средний) | {avg_rw:.0%} |",
        f"| Raw concept coverage (средний) | {avg_coverage:.0%} |",
        f"| Цитаты (где ожидались) | {citations_ok}/{len(citations_expected)} ({citations_ok/max(len(citations_expected),1):.0%}) |",
        f"| Признаки галлюцинаций | {len(hallucinated)} вопросов |",
        f"| Latency p50 / p95 / p99 (ms) | {latency_overall['p50']:.0f} / {latency_overall['p95']:.0f} / {latency_overall['p99']:.0f} |",
        f"| Ошибки вызова API | {errors} |",
        f"",
    ]

    lines += ["## По ролям", ""]
    lines += [
        "| Роль | Пройдено | Role-weighted | Raw coverage | Цитаты | p50 ms | p95 ms |",
        "|---|---|---|---|---|---|---|",
    ]
    for role, role_results in sorted(by_role.items()):
        ok = [r for r in role_results if not r["error"]]
        rp = sum(1 for r in role_results if r["passed"])
        rc = sum(r["concept_coverage"] for r in ok) / max(len(ok), 1)
        rw = sum(r["role_weighted_score"] for r in ok) / max(len(ok), 1)
        rq = sum(1 for r in role_results if r["citation_found"] and r["citation_expected"])
        rq_exp = sum(1 for r in role_results if r["citation_expected"])
        lp = _percentiles([r["latency_ms"] for r in ok])
        lines.append(
            f"| {role} | {rp}/{len(role_results)} | {rw:.0%} | {rc:.0%} | "
            f"{rq}/{max(rq_exp,1)} | {lp['p50']:.0f} | {lp['p95']:.0f} |"
        )
    lines.append("")

    lines += ["## Детали по вопросам", ""]
    for r in results:
        icon = "✅" if r["passed"] else "❌"
        lines.append(f"### {icon} {r['id']} `{r['role']}` — {r['notes']}")
        lines.append(f"")
        lines.append(f"**Вопрос:** {r['question']}")
        lines.append(f"")
        if r["error"]:
            lines.append(f"**Ошибка API:** `{r['error']}`")
        else:
            lines.append(f"**Охват концептов:** {r['concept_coverage']:.0%}")
            if r["concepts_found"]:
                lines.append(f"**Найдены:** {', '.join(r['concepts_found'])}")
            if r["concepts_missing"]:
                lines.append(f"**Пропущены:** {', '.join(r['concepts_missing'])}")
            if r.get("role_checks"):
                role_summary = ", ".join(
                    f"{k}: {'✓' if v else '✗'}" for k, v in r["role_checks"].items()
                )
                lines.append(f"**Role-чек ({r['role']}):** {role_summary}")
            lines.append(f"**Цитата:** {'✓ присутствует' if r['citation_found'] else '✗ отсутствует'}" +
                         (f" (ожидалась)" if r["citation_expected"] and not r["citation_found"] else ""))
            if r["hallucination_flags"]:
                lines.append(f"**Признаки галлюцинаций:** {', '.join(r['hallucination_flags'])}")
            lines.append(f"")
            preview = r["response"][:400].replace("\n", " ")
            lines.append(f"**Ответ (превью):** {preview}…")
        lines.append("")

    if hallucinated:
        lines += ["## ⚠️ Возможные галлюцинации", ""]
        for r in hallucinated:
            lines.append(f"- **{r['id']}**: {', '.join(r['hallucination_flags'])}")
        lines.append("")

    return "\n".join(lines)

# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="MindFlow mentor benchmark")
    parser.add_argument("--api-url", default="http://localhost:8787", help="API base URL")
    parser.add_argument("--output", default="tests/llm/benchmark_report.md", help="Output report path")
    parser.add_argument("--questions", default="tests/llm/benchmark_questions.csv", help="CSV with questions")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between requests (seconds)")
    parser.add_argument("--filter-role", help="Run only questions for this role (LECTURER, SANDBOX, …)")
    parser.add_argument(
        "--json-output",
        default="report/data/mentor_benchmark.json",
        help="Where to dump raw per-question results + aggregated metrics (JSON)",
    )
    parser.add_argument(
        "--debug-chunks",
        action="store_true",
        help="Pass ?debug=1 to the API so sourcesUsed[*].text is included (needed for faithfulness judge)",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).parent.parent.parent
    csv_path = repo_root / args.questions
    output_path = repo_root / args.output

    if not csv_path.exists():
        print(f"ERROR: questions file not found: {csv_path}")
        sys.exit(1)

    questions = load_questions(csv_path)

    if args.filter_role:
        questions = [q for q in questions if q["role"] == args.filter_role.upper()]
        if not questions:
            print(f"ERROR: no questions found for role '{args.filter_role}'")
            sys.exit(1)

    print(f"\nMindFlow Mentor Benchmark")
    print(f"API: {args.api_url}")
    print(f"Questions: {len(questions)}")
    print(f"{'─' * 72}")

    results = run_benchmark(
        args.api_url, questions, delay=args.delay, debug_chunks=args.debug_chunks
    )

    print(f"{'─' * 72}")
    passed = sum(1 for r in results if r["passed"])
    print(f"Result: {passed}/{len(results)} passed")

    report = generate_report(results, args.api_url)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(report, encoding="utf-8")
    print(f"Report saved: {output_path}")

    # Dump raw results + aggregated metrics as JSON for reproducibility / plots
    json_path = repo_root / args.json_output
    json_path.parent.mkdir(parents=True, exist_ok=True)
    errors = sum(1 for r in results if r["error"])
    cit_exp = [r for r in results if r["citation_expected"]]
    cit_ok = sum(1 for r in cit_exp if r["citation_found"])
    ok_all = [r for r in results if not r["error"]]
    latency_overall = _percentiles([r["latency_ms"] for r in ok_all])
    aggregated = {
        "n_questions": len(results),
        "n_passed": passed,
        "pass_rate": passed / len(results) if results else 0.0,
        "avg_concept_coverage": (
            sum(r["concept_coverage"] for r in ok_all) / max(len(ok_all), 1)
        ),
        "avg_role_weighted_score": (
            sum(r["role_weighted_score"] for r in ok_all) / max(len(ok_all), 1)
        ),
        "citation_rate": cit_ok / len(cit_exp) if cit_exp else 0.0,
        "n_with_hallucination_flags": sum(1 for r in results if r["hallucination_flags"]),
        "n_errors": errors,
        "latency_ms": latency_overall,
        "by_role": {},
    }
    by_role: dict[str, list[Result]] = {}
    for r in results:
        by_role.setdefault(r["role"], []).append(r)
    for role, rs in by_role.items():
        rs_ok = [r for r in rs if not r["error"]]
        # Aggregate role-specific check pass rates across questions of this role
        role_check_rates: dict[str, float] = {}
        if rs_ok:
            check_keys: set[str] = set()
            for r in rs_ok:
                check_keys.update((r.get("role_checks") or {}).keys())
            for key in check_keys:
                hits = sum(1 for r in rs_ok if (r.get("role_checks") or {}).get(key))
                role_check_rates[key] = hits / len(rs_ok)

        aggregated["by_role"][role] = {
            "n": len(rs),
            "pass_rate": sum(1 for r in rs if r["passed"]) / len(rs),
            "avg_concept_coverage": (
                sum(r["concept_coverage"] for r in rs_ok) / max(len(rs_ok), 1)
            ),
            "avg_role_weighted_score": (
                sum(r["role_weighted_score"] for r in rs_ok) / max(len(rs_ok), 1)
            ),
            "latency_ms": _percentiles([r["latency_ms"] for r in rs_ok]),
            "role_check_rates": role_check_rates,
        }
    json_path.write_text(
        json.dumps({"aggregated": aggregated, "per_question": results},
                   ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"JSON saved:   {json_path}")

    # Exit with non-zero if more than half failed (useful for CI)
    if passed < len(results) / 2:
        sys.exit(1)

if __name__ == "__main__":
    main()
