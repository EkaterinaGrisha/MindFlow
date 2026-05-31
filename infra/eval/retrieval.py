"""
Retrieval quality evaluation for MindFlow RAG.

Считает Precision@k, Recall@k, MRR на golden-датасете (tests/llm/benchmark_questions.csv).
Сравнивает выдачу /api/rag/search с разметкой relevant_doc_ids (document-level).

Запуск:
    # Сначала поднять API: npm run dev:api  (в отдельном терминале)
    python3 infra/eval/retrieval.py

Опционально:
    python3 infra/eval/retrieval.py --api http://localhost:8787 --top-k 10
    python3 infra/eval/retrieval.py --csv tests/llm/benchmark_questions.csv

Результаты:
    report/data/retrieval_raw.json    — сырые ответы API на каждый вопрос
    report/data/retrieval_metrics.json — агрегированные метрики
    report/tables/retrieval_table.md  — таблица в Markdown для отчёта
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CSV = REPO_ROOT / "tests" / "llm" / "benchmark_questions.csv"
DATA_DIR = REPO_ROOT / "report" / "data"
TABLES_DIR = REPO_ROOT / "report" / "tables"

K_VALUES = (3, 5, 10)


def load_questions(csv_path: Path) -> list[dict[str, Any]]:
    with csv_path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        questions = []
        for row in reader:
            relevant = [
                doc.strip()
                for doc in (row.get("relevant_doc_ids") or "").split(";")
                if doc.strip()
            ]
            if not relevant:
                continue  # пропускаем вопросы без разметки
            questions.append({
                "id": row["id"],
                "question": row["question"],
                "role": row["role"],
                "relevant_doc_ids": relevant,
            })
    return questions


def call_rag_search(
    api_url: str,
    query: str,
    top_k: int,
    dense_weight: float | None = None,
    lex_weight: float | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {"query": query, "top_k": top_k}
    if dense_weight is not None:
        payload["dense_weight"] = dense_weight
    if lex_weight is not None:
        payload["lex_weight"] = lex_weight
    req = Request(
        url=f"{api_url.rstrip('/')}/api/rag/search",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def precision_at_k(retrieved_doc_ids: list[str], relevant: set[str], k: int) -> float:
    top_k = retrieved_doc_ids[:k]
    if not top_k:
        return 0.0
    hits = sum(1 for doc in top_k if doc in relevant)
    return hits / len(top_k)


def recall_at_k(retrieved_doc_ids: list[str], relevant: set[str], k: int) -> float:
    if not relevant:
        return 0.0
    top_k = retrieved_doc_ids[:k]
    hits = sum(1 for doc in top_k if doc in relevant)
    return hits / len(relevant)


def reciprocal_rank(retrieved_doc_ids: list[str], relevant: set[str]) -> float:
    for i, doc in enumerate(retrieved_doc_ids, start=1):
        if doc in relevant:
            return 1.0 / i
    return 0.0


def evaluate(
    api_url: str,
    questions: list[dict[str, Any]],
    top_k: int,
    dense_weight: float | None = None,
    lex_weight: float | None = None,
) -> tuple[list[dict], dict]:
    per_question: list[dict[str, Any]] = []
    metric_accumulators: dict[str, list[float]] = {
        **{f"precision@{k}": [] for k in K_VALUES},
        **{f"recall@{k}": [] for k in K_VALUES},
        "mrr": [],
    }

    for q in questions:
        print(f"  [{q['id']}] {q['question'][:60]}…", flush=True)
        try:
            t0 = time.time()
            response = call_rag_search(api_url, q["question"], top_k, dense_weight, lex_weight)
            latency_ms = (time.time() - t0) * 1000
        except (HTTPError, URLError, TimeoutError) as e:
            print(f"     ERROR: {e}", flush=True)
            per_question.append({**q, "error": str(e)})
            continue

        chunks = response.get("chunks", []) or []
        # Документная дедупликация: source_id может повторяться у разных чанков,
        # для document-level метрики нас интересует ранг ПЕРВОГО появления документа.
        seen = []
        for c in chunks:
            sid = c.get("source_id")
            if sid and sid not in seen:
                seen.append(sid)

        relevant = set(q["relevant_doc_ids"])
        q_metrics = {
            "id": q["id"],
            "question": q["question"],
            "role": q["role"],
            "relevant_doc_ids": q["relevant_doc_ids"],
            "retrieved_doc_ids": seen,
            "retrieved_chunk_count": len(chunks),
            "latency_ms": round(latency_ms, 1),
            "meta": response.get("meta"),
        }
        for k in K_VALUES:
            p = precision_at_k(seen, relevant, k)
            r = recall_at_k(seen, relevant, k)
            q_metrics[f"precision@{k}"] = p
            q_metrics[f"recall@{k}"] = r
            metric_accumulators[f"precision@{k}"].append(p)
            metric_accumulators[f"recall@{k}"].append(r)
        rr = reciprocal_rank(seen, relevant)
        q_metrics["reciprocal_rank"] = rr
        metric_accumulators["mrr"].append(rr)

        per_question.append(q_metrics)

    aggregated = {
        name: (sum(vals) / len(vals)) if vals else 0.0
        for name, vals in metric_accumulators.items()
    }
    aggregated["n_questions"] = len([q for q in per_question if "error" not in q])
    return per_question, aggregated


def write_markdown_table(metrics: dict, output: Path) -> None:
    lines = [
        "# Retrieval quality on golden dataset (n = {n})".format(n=metrics["n_questions"]),
        "",
        "| k | Precision@k | Recall@k |",
        "| --- | --- | --- |",
    ]
    for k in K_VALUES:
        lines.append(
            f"| {k} | {metrics[f'precision@{k}']:.3f} | {metrics[f'recall@{k}']:.3f} |"
        )
    lines += ["", f"**MRR** = {metrics['mrr']:.3f}", ""]
    output.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="RAG retrieval evaluation")
    parser.add_argument("--api", default="http://localhost:8787", help="API base URL")
    parser.add_argument("--top-k", type=int, default=10, help="how many chunks to request")
    parser.add_argument("--csv", default=str(DEFAULT_CSV), help="path to benchmark CSV")
    parser.add_argument("--dense-weight", type=float, default=None,
                        help="override RRF weight for dense branch (server default = 1.0)")
    parser.add_argument("--lex-weight", type=float, default=None,
                        help="override RRF weight for BM25 branch (server default = 1.0)")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        print(f"ERROR: CSV not found: {csv_path}", file=sys.stderr)
        return 1

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    TABLES_DIR.mkdir(parents=True, exist_ok=True)

    questions = load_questions(csv_path)
    if not questions:
        print("ERROR: no questions with relevant_doc_ids found", file=sys.stderr)
        return 1

    print(f"Loaded {len(questions)} questions with relevance annotations")
    print(f"Querying API: {args.api}  (top_k = {args.top_k})")
    print("─" * 64)

    per_question, aggregated = evaluate(
        args.api, questions, args.top_k, args.dense_weight, args.lex_weight
    )

    raw_path = DATA_DIR / "retrieval_raw.json"
    metrics_path = DATA_DIR / "retrieval_metrics.json"
    table_path = TABLES_DIR / "retrieval_table.md"

    raw_path.write_text(json.dumps(per_question, ensure_ascii=False, indent=2), encoding="utf-8")
    metrics_path.write_text(json.dumps(aggregated, ensure_ascii=False, indent=2), encoding="utf-8")
    write_markdown_table(aggregated, table_path)

    print("─" * 64)
    print(f"Questions evaluated: {aggregated['n_questions']} / {len(questions)}")
    for k in K_VALUES:
        print(f"  Precision@{k} = {aggregated[f'precision@{k}']:.3f}")
        print(f"  Recall@{k}    = {aggregated[f'recall@{k}']:.3f}")
    print(f"  MRR           = {aggregated['mrr']:.3f}")
    print()
    print(f"Saved: {raw_path.relative_to(REPO_ROOT)}")
    print(f"Saved: {metrics_path.relative_to(REPO_ROOT)}")
    print(f"Saved: {table_path.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
