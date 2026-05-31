"""
pkg_lecturer_benchmark.py

Measure the effect of adding student profile to the LECTURER prompt.

Setup:
    - 50 golden-set questions (same as in graph_rag and embedding benchmarks)
    - For each question we generate TWO mentor answers:
        A) baseline LECTURER (retrieved_theory only)
        B) PKG-aware LECTURER (retrieved_theory + student profile)
    - DeepSeek-judge compares which is more useful TO THIS SPECIFIC STUDENT
      (judge sees the profile, not just the answers)
    - Profile is from user `a67a43d8` (rich profile: 8 strong, 8 weak, goal,
      recent topics). On a cold-start user the result would trivially be TIE.

This complements graph_rag_benchmark.py (which measured the EduKG-only
augmentation and found it hurts). Here we measure whether personal data
(strong/weak/recent) is useful in passive context augmentation — a
different signal than abstract graph relationships.

Stages:
    1. answers — generate (A, B) pair per query
    2. judges  — DeepSeek-judge each pair with profile context
    3. report  — render reports/pkg-lecturer-benchmark.md
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
import time
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(__file__).resolve().parent / "benchmark_data"
CANDS_PATH = DATA_DIR / "candidates.json"
ANSWERS_PATH = DATA_DIR / "pkg_lecturer_answers.json"
JUDGES_PATH = DATA_DIR / "pkg_lecturer_judges.json"
REPORT_PATH = ROOT / "reports" / "pkg-lecturer-benchmark.md"

# Rich-profile user from real DB (8 strong, 8 weak, goal, recent topics)
TEST_USER_HINT = "a67a43d8"

load_dotenv(ROOT / ".env")
DEEPSEEK_KEY = os.environ["DEEPSEEK_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

RANDOM_SEED = 42
TOP_K = 5

# ─── LECTURER prompts ────────────────────────────────────────────────────────

LECTURER_BASELINE = """ROLE: преподаватель-практик по математике для будущих data scientists.
MISSION: объяснить тему подробно, пошагово и без занудства — так, чтобы человек понял суть.

КАК ПИСАТЬ:
Пиши естественно, как умный преподаватель, который говорит вслух. Один концепт за раз. Формулы в LaTeX.

ИСТОЧНИКИ — ЖЁСТКОЕ ПРАВИЛО:
База — retrieved_theory в формате `[N] [Учебник] Источник: текст`. После каждого фактического утверждения, определения, формулы ставь маркер `[N]` прямо в строке. Минимум 2-3 маркера на ответ.

ЗАВЕРШАЙ ответ открытым вопросом или мини-проверкой."""

LECTURER_PKG = LECTURER_BASELINE + """

ПРОФИЛЬ СТУДЕНТА (если есть):
В начале промта будет блок «ПРОФИЛЬ СТУДЕНТА» — что студент уже знает (strong), где путается (weak), что недавно спрашивал (recent), и его цель.
Используй эту инфу:
- На сильных темах не разжёвывай заново — упомяни кратко
- На слабых местах объясни подробнее, с примером
- Свяжи новую тему с тем, что студент уже учил (если уместно)
- Если тема пересекается со слабым местом — отметь это и предложи дополнительную практику"""

# ─── Helpers (mirror of graph_rag_benchmark.py) ──────────────────────────────

def deepseek_chat(system: str, user: str, max_tokens: int = 900, temperature: float = 0.3) -> str:
    r = requests.post(
        "https://api.deepseek.com/chat/completions",
        headers={"Authorization": f"Bearer {DEEPSEEK_KEY}", "Content-Type": "application/json"},
        json={
            "model": "deepseek-chat",
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "temperature": temperature, "max_tokens": max_tokens,
        }, timeout=120,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def supabase_select(table: str, query: str) -> list[dict[str, Any]]:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}?{query}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def build_retrieved_theory(chunk_texts: list[str], chunk_ids: list[str]) -> str:
    rows = supabase_select("rag_chunks", f"select=id,source_title,page_hint&id=in.({','.join(chunk_ids)})")
    by_id = {r["id"]: r for r in rows}
    parts: list[str] = []
    for i, (cid, text) in enumerate(zip(chunk_ids, chunk_texts), 1):
        meta = by_id.get(cid, {})
        title = meta.get("source_title", "?")
        page = meta.get("page_hint")
        suffix = f" ({page})" if page else ""
        parts.append(f"[{i}] [Учебник] {title}{suffix}: {text}")
    return "\n\n".join(parts)


# ─── Resolve test user and fetch profile via the same TS function ────────────

def resolve_user_id(hint: str) -> str:
    rows = supabase_select("personal_kg_nodes", "select=user_id&limit=200")
    for r in rows:
        if r["user_id"].startswith(hint):
            return r["user_id"]
    raise RuntimeError(f"No user found matching hint {hint}")


PROFILE_TSX = """
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { buildStudentProfile, formatProfileForPrompt } from "./src/llm/studentProfile";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const profile = await buildStudentProfile(process.argv[2], supabase);
  process.stdout.write(JSON.stringify({ formatted: formatProfileForPrompt(profile), raw: profile }));
}
main().catch(e => { console.error(e); process.exit(1); });
"""


def fetch_profile(user_id: str) -> dict[str, Any]:
    import subprocess
    wrapper = ROOT / "apps" / "api" / "_profile_runner.ts"
    wrapper.write_text(PROFILE_TSX)
    try:
        proc = subprocess.run(
            ["npx", "tsx", "_profile_runner.ts", user_id],
            cwd=str(ROOT / "apps" / "api"),
            capture_output=True, text=True, timeout=60,
        )
        if proc.returncode != 0:
            raise RuntimeError(f"profile runner failed: {proc.stderr[:300]}")
        return json.loads(proc.stdout)
    finally:
        try: wrapper.unlink()
        except FileNotFoundError: pass


# ─── Build user prompts ──────────────────────────────────────────────────────

def build_user_baseline(query: str, retrieved_theory: str) -> str:
    return f"""СТУДЕНТ СПРАШИВАЕТ: {query}

RETRIEVED_THEORY:
{retrieved_theory}

Ответь студенту по правилам ROLE/MISSION."""


def build_user_pkg(query: str, retrieved_theory: str, profile_block: str) -> str:
    return f"""СТУДЕНТ СПРАШИВАЕТ: {query}

{profile_block}

RETRIEVED_THEORY:
{retrieved_theory}

Ответь студенту по правилам ROLE/MISSION с учётом его профиля."""


# ─── Stage 1: answers ────────────────────────────────────────────────────────

def stage_answers() -> None:
    if not CANDS_PATH.exists():
        sys.exit("[answers] candidates.json missing — run rerank_benchmark --stage candidates first")
    cands: list[dict[str, Any]] = json.loads(CANDS_PATH.read_text())

    print(f"[answers] resolving user {TEST_USER_HINT}...")
    user_id = resolve_user_id(TEST_USER_HINT)
    prof = fetch_profile(user_id)
    profile_block = prof["formatted"]
    print(f"[answers] profile for {user_id[:8]}:")
    print(profile_block[:300])
    print()

    existing: dict[str, dict[str, Any]] = {}
    if ANSWERS_PATH.exists():
        existing = {p["query"]: p for p in json.loads(ANSWERS_PATH.read_text())}
        print(f"[answers] resuming: {len(existing)} pairs already done")

    out: list[dict[str, Any]] = list(existing.values())
    pending = [c for c in cands if c["query"] not in existing]
    print(f"[answers] {len(pending)} pairs to generate")

    for i, c in enumerate(pending, 1):
        top_chunk_ids = c["candidate_ids"][:TOP_K]
        top_chunk_texts = c["candidate_texts"][:TOP_K]
        retrieved = build_retrieved_theory(top_chunk_texts, top_chunk_ids)

        user_a = build_user_baseline(c["query"], retrieved)
        user_b = build_user_pkg(c["query"], retrieved, profile_block)

        try:
            print(f"[answers] [{i}/{len(pending)}] {c['query'][:60]}...")
            ans_a = deepseek_chat(LECTURER_BASELINE, user_a)
            ans_b = deepseek_chat(LECTURER_PKG, user_b)
        except Exception as e:
            print(f"[answers]   FAILED: {e}")
            continue

        out.append({
            "query": c["query"],
            "user_id": user_id,
            "answer_baseline": ans_a,
            "answer_with_pkg": ans_b,
            "profile_used": profile_block,
        })
        ANSWERS_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2))

    print(f"[answers] saved {len(out)} pairs → {ANSWERS_PATH}")


# ─── Stage 2: judge ──────────────────────────────────────────────────────────

JUDGE_SYSTEM = """Ты — строгий рецензент образовательных ответов.
Перед тобой будет вопрос студента, его краткий профиль (что он знает, в чём путается) и два варианта ответа учителя.
Оцени, какой ответ ЛУЧШЕ ПОДХОДИТ ИМЕННО ЭТОМУ СТУДЕНТУ:
- Учитывает ли его уровень?
- На сильных темах не разжёвывает заново?
- На слабых местах объясняет подробнее?
- Связывает новую тему с тем, что студент уже знает?

Ответь одним словом: A, B, или TIE."""


JUDGE_USER_TMPL = """ВОПРОС СТУДЕНТА:
{query}

ПРОФИЛЬ СТУДЕНТА:
{profile}

ОТВЕТ A:
{ans_a}

ОТВЕТ B:
{ans_b}

Какой ответ лучше подходит этому конкретному студенту? Ответ: A, B, или TIE."""


def stage_judges() -> None:
    if not ANSWERS_PATH.exists():
        sys.exit("[judges] run --stage answers first")
    answers = json.loads(ANSWERS_PATH.read_text())
    existing = {j["query"]: j for j in json.loads(JUDGES_PATH.read_text())} if JUDGES_PATH.exists() else {}
    rng = random.Random(RANDOM_SEED)
    out = list(existing.values())
    pending = [a for a in answers if a["query"] not in existing]
    print(f"[judges] {len(pending)} pairs to judge")

    for i, pair in enumerate(pending, 1):
        if rng.random() < 0.5:
            ans_a, ans_b = pair["answer_baseline"], pair["answer_with_pkg"]
            order = "baseline_is_A"
        else:
            ans_a, ans_b = pair["answer_with_pkg"], pair["answer_baseline"]
            order = "pkg_is_A"

        user_prompt = JUDGE_USER_TMPL.format(
            query=pair["query"], profile=pair["profile_used"], ans_a=ans_a, ans_b=ans_b,
        )
        try:
            verdict_raw = deepseek_chat(JUDGE_SYSTEM, user_prompt, max_tokens=20, temperature=0)
        except Exception as e:
            print(f"[judges] failed: {e}")
            continue

        first = verdict_raw.strip().upper().split()[0] if verdict_raw.strip() else ""
        if first.startswith("TIE"): winner = "tie"
        elif first.startswith("A"): winner = "baseline" if order == "baseline_is_A" else "pkg"
        elif first.startswith("B"): winner = "pkg" if order == "baseline_is_A" else "baseline"
        else: winner = f"unparseable:{first}"

        out.append({"query": pair["query"], "order": order, "verdict_raw": verdict_raw, "winner": winner})
        print(f"[judges] [{i}/{len(pending)}] order={order} → {winner}")
        JUDGES_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2))

    print(f"[judges] {len(out)} verdicts saved")


# ─── Stage 3: report ─────────────────────────────────────────────────────────

def stage_report() -> None:
    if not JUDGES_PATH.exists(): sys.exit("[report] run judges first")
    judges = json.loads(JUDGES_PATH.read_text())
    n = len(judges)
    pkg = sum(1 for j in judges if j["winner"] == "pkg")
    base = sum(1 for j in judges if j["winner"] == "baseline")
    ties = sum(1 for j in judges if j["winner"] == "tie")
    bad = sum(1 for j in judges if j["winner"].startswith("unparseable"))

    answers = json.loads(ANSWERS_PATH.read_text())
    profile_used = answers[0]["profile_used"] if answers else ""

    lines: list[str] = []
    lines.append("# PKG-aware LECTURER benchmark")
    lines.append("")
    lines.append("Замер: помогает ли передача профиля студента (`strong/weak/recent/goal`) в обычный prompt ментора LECTURER?")
    lines.append("")
    lines.append("**Стенд:**")
    lines.append("- 50 студенческих вопросов из того же golden set")
    lines.append("- Top-5 чанков от Qwen3-Embedding-0.6B (cached)")
    lines.append("- Имитация: вопросы задаёт реальный пользователь из БД с богатым профилем (`a67a43d8`)")
    lines.append("- 2 ответа на вопрос: A=baseline LECTURER, B=PKG-aware LECTURER (получает блок ПРОФИЛЬ)")
    lines.append("- DeepSeek-judge видит профиль + оба ответа, выбирает кто лучше подходит ИМЕННО этому студенту")
    lines.append("")
    lines.append("**Профиль пользователя (использован для всех 50 ответов):**")
    lines.append("")
    lines.append("```")
    lines.append(profile_used)
    lines.append("```")
    lines.append("")
    lines.append("## Результаты")
    lines.append("")
    lines.append("| Вердикт | Кол-во | % |")
    lines.append("|---|---:|---:|")
    if n > 0:
        lines.append(f"| ответ с PKG лучше подходит студенту | **{pkg}** | **{pkg/n*100:.0f}%** |")
        lines.append(f"| baseline лучше | {base} | {base/n*100:.0f}% |")
        lines.append(f"| равноценны (TIE) | {ties} | {ties/n*100:.0f}% |")
        if bad: lines.append(f"| судья не распарсился | {bad} | {bad/n*100:.0f}% |")
    lines.append("")

    if n > 0:
        denom = max(n - bad - ties, 1)
        pkg_share = pkg / denom
        if pkg_share >= 0.55:
            lines.append(f"✅ **PKG-aware LECTURER статистически помогает** ({pkg}/{denom} = {pkg_share*100:.0f}% решающих сравнений в его пользу). Рекомендуется подключение в продакшен.")
        elif pkg_share <= 0.45:
            lines.append(f"🤷 **PKG-aware LECTURER в среднем не помогает** ({pkg}/{denom} = {pkg_share*100:.0f}%). Profile в обычном LECTURER prompt — нейтрален или вреден.")
        else:
            lines.append(f"⚖️ **Эффект около нейтрального** ({pkg}/{denom} = {pkg_share*100:.0f}%). Возможно профиль нужен только для специфических use-cases (генерация задач), не для обычного объяснения.")
    lines.append("")
    lines.append("## Контекст: где PKG уже точно помогает")
    lines.append("")
    lines.append("См. `reports/pkg-based-architecture.md` — генерация задач под слабые места (Slojl 3 PKG-архитектуры) дала **3:0:1tie** в пользу PKG. То есть PKG-сигнал работает в **активной генерации**, где модель должна выбрать ЧТО создать.")
    lines.append("")
    lines.append("Этот бенчмарк измеряет другое: помогает ли тот же профиль в **пассивном объяснении темы**, где модель просто разворачивает retrieved_theory.")
    lines.append("")
    lines.append("## Методика")
    lines.append("")
    lines.append("1. Тот же golden set (50 пар), что в `reports/embedding-benchmark.md`.")
    lines.append("2. Profile из `buildStudentProfile(a67a43d8)` — 8 strong + 8 weak + recent + goal.")
    lines.append("3. Для каждого запроса 2 ответа DeepSeek-chat (LECTURER baseline vs LECTURER+PKG).")
    lines.append("4. DeepSeek-judge видит профиль и оба ответа. Порядок A/B рандомизирован.")
    lines.append("5. Метрика: процент побед PKG vs baseline vs ties.")
    lines.append("")
    lines.append("Воспроизведение: `python3 infra/scripts/pkg_lecturer_benchmark.py --stage all`. Кеш в `pkg_lecturer_answers.json` и `pkg_lecturer_judges.json`.")
    lines.append("")
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines))
    print(f"[report] wrote {REPORT_PATH}")


# ─── CLI ─────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", required=True, choices=["all", "answers", "judges", "report"])
    args = ap.parse_args()
    if args.stage in ("all", "answers"): stage_answers()
    if args.stage in ("all", "judges"): stage_judges()
    if args.stage in ("all", "report"): stage_report()


if __name__ == "__main__":
    main()
