"""
graph_rag_benchmark.py

Measure the effect of Architecture #1 ("Graph as filter/augmenter") on
mentor answer quality. The graph does NOT change which chunks are retrieved —
it only adds related-concept context to the LLM prompt. So retrieval metrics
(R@K, NDCG) cannot detect the effect. We need to compare the actual answers.

Method:
    1. Take 50 golden queries (from rerank_benchmark candidates.json)
    2. For each query: top-5 chunks from Qwen3 dense (already cached)
    3. Build TWO prompts:
       A) baseline: LECTURER + retrieved_theory only
       B) +graph: LECTURER + retrieved_theory + graph_context (prereq + next_step concepts)
    4. DeepSeek generates both answers
    5. DeepSeek-judge picks the more useful answer (with randomized A/B order)
    6. Aggregate: win/tie/lose rates → does graph context actually help?

Stages (cached, resumable):
    1. answers — generate (A, B) answer pair for each query (cached per query)
    2. judges  — DeepSeek judges each (A, B) pair (cached)
    3. report  — aggregate stats into reports/graph-rag-benchmark.md
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
ANSWERS_PATH = DATA_DIR / "graph_rag_answers.json"
JUDGES_PATH = DATA_DIR / "graph_rag_judges.json"
REPORT_PATH = ROOT / "reports" / "graph-rag-benchmark.md"

TOP_K = 5  # how many chunks to include in retrieved_theory (matches prod LECTURER budget)
RANDOM_SEED = 42

load_dotenv(ROOT / ".env")
DEEPSEEK_KEY = os.environ["DEEPSEEK_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# ─── Mentor prompt (LECTURER, trimmed for benchmark — same intent as prod) ────

LECTURER_SYSTEM = """ROLE: преподаватель-практик по математике для будущих data scientists.
MISSION: объяснить тему подробно, пошагово и без занудства — так, чтобы человек понял суть.

КАК ПИСАТЬ:
Пиши естественно, как умный преподаватель, который говорит вслух. Один концепт за раз. Формулы в LaTeX.

ИСТОЧНИКИ — ЖЁСТКОЕ ПРАВИЛО:
База — retrieved_theory в формате `[N] [Учебник] Источник: текст`. После каждого фактического утверждения, определения, формулы ставь маркер `[N]` прямо в строке. Минимум 2-3 маркера на ответ. Если retrieved_theory пуст — честно скажи и не додумывай.

ГРАФ ЗНАНИЙ (если есть):
Если в контексте есть «ГРАФ ЗНАНИЙ — связанные концепции», обязательно упомяни в конце ответа: что нужно изучить ДО этой темы (prerequisites) и какие темы открываются ПОСЛЕ (next steps). Это критично для построения учебной траектории студента.

ЗАВЕРШАЙ ответ открытым вопросом или мини-проверкой."""

# ─── DeepSeek wrappers ────────────────────────────────────────────────────────

def deepseek_chat(system: str, user: str, max_tokens: int = 800, temperature: float = 0.3) -> str:
    r = requests.post(
        "https://api.deepseek.com/chat/completions",
        headers={"Authorization": f"Bearer {DEEPSEEK_KEY}", "Content-Type": "application/json"},
        json={
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        },
        timeout=120,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def supabase_rpc(fn: str, params: dict[str, Any]) -> list[dict[str, Any]]:
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/{fn}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        },
        json=params,
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def supabase_select(table: str, query: str) -> list[dict[str, Any]]:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}?{query}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


# ─── Build the two prompts (with and without graph context) ───────────────────

def build_retrieved_theory(chunk_texts: list[str], chunk_ids: list[str]) -> str:
    rows = supabase_select(
        "rag_chunks",
        f"select=id,source_title,page_hint,topic_tags&id=in.({','.join(chunk_ids)})",
    )
    by_id = {r["id"]: r for r in rows}
    parts: list[str] = []
    for i, (cid, text) in enumerate(zip(chunk_ids, chunk_texts), 1):
        meta = by_id.get(cid, {})
        title = meta.get("source_title", "?")
        page = meta.get("page_hint")
        page_suffix = f" ({page})" if page else ""
        parts.append(f"[{i}] [Учебник] {title}{page_suffix}: {text}")
    return "\n\n".join(parts)


def collect_topic_tags(chunk_ids: list[str]) -> list[str]:
    rows = supabase_select(
        "rag_chunks",
        f"select=topic_tags&id=in.({','.join(chunk_ids)})",
    )
    tags = set()
    for r in rows:
        for t in (r.get("topic_tags") or []):
            tags.add(t)
    return sorted(tags)


def build_graph_context(chunk_ids: list[str]) -> str:
    """Mirror of apps/api/src/llm/graphRagBoundary.ts:buildGraphRagContext."""
    topic_slugs = collect_topic_tags(chunk_ids)
    if not topic_slugs:
        return ""
    concepts = supabase_rpc("search_concepts_by_topic_slug", {"p_topic_slugs": topic_slugs})
    if not concepts:
        return ""
    concept_ids = [c["concept_id"] for c in concepts]
    neighbors = supabase_rpc("get_concept_neighbors", {"p_concept_ids": concept_ids})
    if not neighbors:
        return ""

    prereqs: dict[str, dict[str, Any]] = {}
    next_steps: dict[str, dict[str, Any]] = {}
    for n in neighbors:
        bucket = prereqs if n["direction"] == "prerequisite" else next_steps
        nid = n["neighbor_concept_id"]
        if nid not in bucket:
            bucket[nid] = n

    parts: list[str] = []
    if prereqs:
        lst = "; ".join(
            f"«{n['neighbor_name']}»" + (f" — {n['neighbor_description'][:80]}" if n.get('neighbor_description') else "")
            for n in prereqs.values()
        )
        parts.append(f"Необходимые базовые концепции (рекомендуй изучить если не знакомы): {lst}.")
    if next_steps:
        lst = "; ".join(
            f"«{n['neighbor_name']}»" + (f" — {n['neighbor_description'][:80]}" if n.get('neighbor_description') else "")
            for n in next_steps.values()
        )
        parts.append(f"Следующие темы, которые открываются после этой: {lst}.")
    if not parts:
        return ""
    return "ГРАФ ЗНАНИЙ — связанные концепции:\n" + "\n".join(parts)


def build_user_prompt(query: str, retrieved_theory: str, graph_context: str | None) -> str:
    parts: list[str] = []
    parts.append(f"СТУДЕНТ СПРАШИВАЕТ: {query}")
    parts.append("")
    parts.append("RETRIEVED_THEORY:")
    parts.append(retrieved_theory)
    if graph_context:
        parts.append("")
        parts.append(graph_context)
    parts.append("")
    parts.append("Ответь студенту по правилам ROLE/MISSION.")
    return "\n".join(parts)


# ─── Stage 1: generate (A, B) answer pairs ───────────────────────────────────

def stage_answers() -> None:
    if not CANDS_PATH.exists():
        sys.exit("[answers] candidates.json missing — run rerank_benchmark --stage candidates first")
    cands: list[dict[str, Any]] = json.loads(CANDS_PATH.read_text())

    existing: dict[str, dict[str, Any]] = {}
    if ANSWERS_PATH.exists():
        existing = {p["query"]: p for p in json.loads(ANSWERS_PATH.read_text())}
        print(f"[answers] resuming: {len(existing)} pairs already generated")

    out: list[dict[str, Any]] = list(existing.values())
    pending = [c for c in cands if c["query"] not in existing]
    print(f"[answers] {len(pending)} pairs to generate")

    for i, c in enumerate(pending, 1):
        top_chunk_ids = c["candidate_ids"][:TOP_K]
        top_chunk_texts = c["candidate_texts"][:TOP_K]

        retrieved_theory = build_retrieved_theory(top_chunk_texts, top_chunk_ids)
        graph_context = build_graph_context(top_chunk_ids)

        user_a = build_user_prompt(c["query"], retrieved_theory, None)
        user_b = build_user_prompt(c["query"], retrieved_theory, graph_context)

        try:
            print(f"[answers] [{i}/{len(pending)}] {c['query'][:60]}... → A...")
            ans_a = deepseek_chat(LECTURER_SYSTEM, user_a, max_tokens=900)
            print(f"[answers]   → B... (graph_context_len={len(graph_context)})")
            ans_b = deepseek_chat(LECTURER_SYSTEM, user_b, max_tokens=900)
        except Exception as e:
            print(f"[answers] FAILED for {c['query'][:40]}: {e}")
            continue

        out.append({
            "query": c["query"],
            "ground_truth_id": c["ground_truth_id"],
            "retrieved_chunk_ids": top_chunk_ids,
            "graph_context": graph_context,
            "graph_context_len": len(graph_context),
            "answer_baseline": ans_a,
            "answer_with_graph": ans_b,
        })
        # Persist after every pair so a crash doesn't lose work
        ANSWERS_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2))

    print(f"[answers] saved {len(out)} pairs → {ANSWERS_PATH}")


# ─── Stage 2: DeepSeek-judge each pair ────────────────────────────────────────

JUDGE_SYSTEM = """Ты — строгий, справедливый рецензент образовательных ответов.
Перед тобой будет вопрос студента и два варианта ответа учителя.
Оцени какой полезнее для понимания темы и построения учебной траектории.
Учитывай: ясность объяснения, наличие связанных тем (что изучить до и после), глубину разбора, корректность ссылок на источники.
Ответь одним словом: A, B, или TIE (если ответы равноценны)."""

JUDGE_USER_TMPL = """ВОПРОС СТУДЕНТА:
{query}

ОТВЕТ A:
{ans_a}

ОТВЕТ B:
{ans_b}

Какой ответ полезнее для студента? Ответ: A, B, или TIE."""


def stage_judges() -> None:
    if not ANSWERS_PATH.exists():
        sys.exit("[judges] graph_rag_answers.json missing — run --stage answers first")
    answers: list[dict[str, Any]] = json.loads(ANSWERS_PATH.read_text())

    existing: dict[str, dict[str, Any]] = {}
    if JUDGES_PATH.exists():
        existing = {j["query"]: j for j in json.loads(JUDGES_PATH.read_text())}
        print(f"[judges] resuming: {len(existing)} already judged")

    rng = random.Random(RANDOM_SEED)
    out: list[dict[str, Any]] = list(existing.values())
    pending = [a for a in answers if a["query"] not in existing]
    print(f"[judges] {len(pending)} pairs to judge")

    for i, pair in enumerate(pending, 1):
        # Randomize A/B order to avoid position bias
        if rng.random() < 0.5:
            ans_a, ans_b = pair["answer_baseline"], pair["answer_with_graph"]
            order = "baseline_is_A"
        else:
            ans_a, ans_b = pair["answer_with_graph"], pair["answer_baseline"]
            order = "graph_is_A"

        user = JUDGE_USER_TMPL.format(query=pair["query"], ans_a=ans_a, ans_b=ans_b)
        try:
            verdict_raw = deepseek_chat(JUDGE_SYSTEM, user, max_tokens=20, temperature=0)
        except Exception as e:
            print(f"[judges] FAILED for {pair['query'][:40]}: {e}")
            continue

        first_token = verdict_raw.strip().upper().split()[0] if verdict_raw.strip() else ""
        # Normalize to {baseline, graph, tie}
        if first_token in {"TIE", "TIE."}:
            winner = "tie"
        elif first_token in {"A", "A."}:
            winner = "baseline" if order == "baseline_is_A" else "graph"
        elif first_token in {"B", "B."}:
            winner = "graph" if order == "baseline_is_A" else "baseline"
        else:
            winner = f"unparseable:{first_token}"

        out.append({
            "query": pair["query"],
            "order": order,
            "verdict_raw": verdict_raw,
            "winner": winner,
            "graph_context_len": pair["graph_context_len"],
        })
        print(f"[judges] [{i}/{len(pending)}] order={order} verdict={first_token} → {winner}")
        JUDGES_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2))

    print(f"[judges] saved {len(out)} verdicts → {JUDGES_PATH}")


# ─── Stage 3: report ──────────────────────────────────────────────────────────

def stage_report() -> None:
    if not JUDGES_PATH.exists():
        sys.exit("[report] no judges — run --stage judges first")
    judges: list[dict[str, Any]] = json.loads(JUDGES_PATH.read_text())

    n = len(judges)
    wins_graph = sum(1 for j in judges if j["winner"] == "graph")
    wins_baseline = sum(1 for j in judges if j["winner"] == "baseline")
    ties = sum(1 for j in judges if j["winner"] == "tie")
    bad = sum(1 for j in judges if j["winner"].startswith("unparseable"))

    queries_with_graph_ctx = sum(1 for j in judges if j["graph_context_len"] > 0)

    lines: list[str] = []
    lines.append("# Graph RAG benchmark — MindFlow corpus")
    lines.append("")
    lines.append(
        "Измерение влияния **Архитектуры #1 («Граф как фильтр/обогащение»)** на качество "
        "ответа AI-ментора. Граф НЕ меняет what retrieves — он добавляет related-concept "
        "context в prompt LLM. Сравниваем mentor answer с graph_context и без."
    )
    lines.append("")
    lines.append(f"- Запросов: **{n}** (golden set из 50 пар)")
    lines.append(f"- Эмбеддер: Qwen3-Embedding-0.6B (топ-5 чанков для каждого запроса)")
    lines.append(f"- LLM-ответ ментора: DeepSeek-chat (системный промт LECTURER)")
    lines.append(f"- Judge: DeepSeek-chat, randomized A/B, temperature=0")
    lines.append(f"- Запросов с непустым graph_context: **{queries_with_graph_ctx}/{n}**")
    lines.append("")
    lines.append("## Результаты")
    lines.append("")
    lines.append("| Вердикт | Кол-во | % |")
    lines.append("|---|---:|---:|")
    if n > 0:
        lines.append(f"| 🏆 ответ с graph_context лучше | **{wins_graph}** | **{wins_graph/n*100:.1f}%** |")
        lines.append(f"| baseline (без graph) лучше | {wins_baseline} | {wins_baseline/n*100:.1f}% |")
        lines.append(f"| равноценны (TIE) | {ties} | {ties/n*100:.1f}% |")
        if bad:
            lines.append(f"| судья не дал внятный ответ | {bad} | {bad/n*100:.1f}% |")
    lines.append("")

    win_rate = wins_graph / max(n - bad, 1)
    if win_rate >= 0.55:
        verdict = "🎯 **Graph context статистически помогает** — стоит чинить и расширять."
    elif win_rate <= 0.45:
        verdict = "🤷 **Graph context статистически вредит или нейтрален** — нужно менять архитектуру или дизайн промта."
    else:
        verdict = "⚖️ **Эффект нейтрален** — graph_context ни помогает, ни мешает. Возможно promo нужно переписать (он не использует подсказки) или нужен более богатый граф."
    lines.append(verdict)
    lines.append("")

    # Conditional on graph_context being non-empty
    if queries_with_graph_ctx < n:
        empty_n = n - queries_with_graph_ctx
        lines.append(
            f"⚠️ У {empty_n} запросов graph_context был пустым (нет связанных концептов в KG). "
            f"Для них Architecture #1 не может ничего изменить — оба ответа должны быть одинаковыми "
            f"(или почти, разница только в temperature)."
        )
        lines.append("")

    lines.append("## Методика")
    lines.append("")
    lines.append("1. Берётся тот же golden set (50 пар), что в `reports/embedding-benchmark.md`.")
    lines.append("2. Для каждого запроса: top-5 чанков от Qwen3-Embedding-0.6B (cached в `infra/scripts/benchmark_data/candidates.json`).")
    lines.append("3. Из retrieved chunks извлекаются `topic_tags` → `search_concepts_by_topic_slug` → `get_concept_neighbors` → формируется graph_context (зеркало `apps/api/src/llm/graphRagBoundary.ts`).")
    lines.append("4. Два промта к LECTURER (системный промт из `prompts/lecturer.md`):")
    lines.append("   - **A (baseline):** retrieved_theory only")
    lines.append("   - **B (+graph):** retrieved_theory + graph_context")
    lines.append("5. DeepSeek-chat генерирует оба ответа (temperature=0.3, max 900 tokens).")
    lines.append("6. DeepSeek-judge (temperature=0) выбирает лучший. Порядок A/B рандомизирован — защита от position bias.")
    lines.append("7. Агрегируем: процент побед graph vs baseline vs ties.")
    lines.append("")
    lines.append("Воспроизведение: `python3 infra/scripts/graph_rag_benchmark.py --stage all`")
    lines.append("")
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines))
    print(f"[report] wrote {REPORT_PATH}")


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", required=True, choices=["all", "answers", "judges", "report"])
    args = ap.parse_args()
    if args.stage in ("all", "answers"):
        stage_answers()
    if args.stage in ("all", "judges"):
        stage_judges()
    if args.stage in ("all", "report"):
        stage_report()


if __name__ == "__main__":
    main()
