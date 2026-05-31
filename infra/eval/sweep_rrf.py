"""
Grid search over RRF weights (dense_weight, lex_weight) on the golden dataset.

Runs the benchmark for a small grid of (dense_weight, lex_weight) pairs and
reports MRR / Precision@k / Recall@k for each. Useful for picking the
production default after migrations 019 (BM25 OR-query) + 020 (RRF weights).

Запуск:
    # Сначала поднять API:  npm run dev:api
    python3 infra/eval/sweep_rrf.py

Опционально:
    python3 infra/eval/sweep_rrf.py --api http://localhost:8787 --top-k 10
    # Кастомная сетка:
    python3 infra/eval/sweep_rrf.py --grid 0.5,1.0 1.0,0.5 1.0,1.0 1.0,2.0 2.0,1.0

Результаты:
    report/data/rrf_sweep.json  — список запусков с агрегированными метриками
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from retrieval import (  # type: ignore[import-not-found]
    DATA_DIR,
    DEFAULT_CSV,
    REPO_ROOT,
    evaluate,
    load_questions,
)

# Default 5-point grid:  pure dense, balanced, lex-heavy, dense-heavy, lex-only-ish
DEFAULT_GRID: list[tuple[float, float]] = [
    (1.0, 0.25),  # mostly dense (BM25 as tie-breaker)
    (1.0, 0.5),   # dense > BM25
    (1.0, 1.0),  # current behavior (control)
    (1.0, 1.5),  # BM25 > dense
    (1.0, 2.0),  # BM25 dominant
]


def parse_grid(values: list[str]) -> list[tuple[float, float]]:
    out: list[tuple[float, float]] = []
    for v in values:
        d_str, l_str = v.split(",")
        out.append((float(d_str), float(l_str)))
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="RRF weights grid search")
    parser.add_argument("--api", default="http://localhost:8787", help="API base URL")
    parser.add_argument("--top-k", type=int, default=10)
    parser.add_argument("--csv", default=str(DEFAULT_CSV))
    parser.add_argument(
        "--grid",
        nargs="*",
        default=None,
        help='pairs "dense,lex" — e.g.  --grid 1.0,0.5 1.0,1.0 1.0,2.0',
    )
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        print(f"ERROR: CSV not found: {csv_path}", file=sys.stderr)
        return 1

    grid = parse_grid(args.grid) if args.grid else DEFAULT_GRID
    questions = load_questions(csv_path)
    if not questions:
        print("ERROR: no questions with relevant_doc_ids found", file=sys.stderr)
        return 1

    print(f"Loaded {len(questions)} questions")
    print(f"Grid: {grid}")
    print(f"Querying API: {args.api}  (top_k = {args.top_k})")
    print("─" * 78)

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    runs: list[dict] = []
    for dense_w, lex_w in grid:
        print(f"\n[dense_weight={dense_w}, lex_weight={lex_w}]")
        _, aggregated = evaluate(args.api, questions, args.top_k, dense_w, lex_w)
        run = {
            "dense_weight": dense_w,
            "lex_weight": lex_w,
            **{k: round(v, 4) if isinstance(v, float) else v for k, v in aggregated.items()},
        }
        runs.append(run)
        print(
            f"  MRR={run['mrr']:.3f}  P@3={run['precision@3']:.3f}  "
            f"P@5={run['precision@5']:.3f}  R@5={run['recall@5']:.3f}  "
            f"R@10={run['recall@10']:.3f}"
        )

    print()
    print("─" * 78)
    print(f"{'dense':>6} {'lex':>6}  {'MRR':>6} {'P@3':>6} {'P@5':>6} {'R@5':>6} {'R@10':>6}")
    print("─" * 78)
    for r in runs:
        print(
            f"{r['dense_weight']:>6.2f} {r['lex_weight']:>6.2f}  "
            f"{r['mrr']:>6.3f} {r['precision@3']:>6.3f} {r['precision@5']:>6.3f} "
            f"{r['recall@5']:>6.3f} {r['recall@10']:>6.3f}"
        )
    print("─" * 78)

    best_mrr = max(runs, key=lambda r: r["mrr"])
    print(
        f"\nBest by MRR: dense={best_mrr['dense_weight']}, "
        f"lex={best_mrr['lex_weight']}  →  MRR={best_mrr['mrr']:.3f}"
    )

    out = DATA_DIR / "rrf_sweep.json"
    out.write_text(json.dumps(runs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSaved: {out.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
