"""
Plot retrieval metrics progression across ablation steps.

Reads aggregated JSON snapshots from report/data/ and produces a single
line chart with six metric curves (MRR, P@3, P@5, R@3, R@5, R@10) over four
checkpoints with saved artifacts: baseline → step 2 → step 3 → step 4.

Step 1 (reranker fix) has no saved JSON snapshot, so it is omitted from the
chart and reported in the report tables only.

Usage:
    python3 infra/eval/plot_progression.py
Output:
    report/figures/metrics_progression.png
"""
from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "report" / "data"
FIG_DIR = REPO_ROOT / "report" / "figures"

CHECKPOINTS = [
    ("Baseline",              "retrieval_metrics_baseline.json"),
    ("Step 2\nper-source cap", "retrieval_metrics_step2_cap.json"),
    ("Step 3\nBM25 OR + budget", "retrieval_metrics_step3_bm25.json"),
    ("Step 4\nRRF weights",    "retrieval_metrics_step4_final.json"),
]

METRICS = [
    ("mrr",          "MRR",          "#1f77b4", "o", "-"),
    ("precision@3",  "Precision@3",  "#2ca02c", "s", "-"),
    ("precision@5",  "Precision@5",  "#2ca02c", "^", "--"),
    ("recall@3",     "Recall@3",     "#d62728", "s", "-"),
    ("recall@5",     "Recall@5",     "#d62728", "^", "--"),
    ("recall@10",    "Recall@10",    "#d62728", "D", ":"),
]


def load_series() -> tuple[list[str], dict[str, list[float]]]:
    labels: list[str] = []
    series: dict[str, list[float]] = {m[0]: [] for m in METRICS}
    for label, fname in CHECKPOINTS:
        path = DATA_DIR / fname
        data = json.loads(path.read_text(encoding="utf-8"))
        labels.append(label)
        for key, *_ in METRICS:
            series[key].append(float(data[key]))
    return labels, series


def main() -> None:
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    labels, series = load_series()
    x = list(range(len(labels)))

    fig, ax = plt.subplots(figsize=(9, 5.5))

    for key, label, color, marker, linestyle in METRICS:
        ys = series[key]
        ax.plot(x, ys, color=color, marker=marker, linestyle=linestyle,
                linewidth=1.8, markersize=7, label=label)
        # Annotate first and last point of MRR for emphasis
        if key == "mrr":
            for xi, yi in [(x[0], ys[0]), (x[-1], ys[-1])]:
                ax.annotate(f"{yi:.3f}", (xi, yi),
                            textcoords="offset points", xytext=(0, 10),
                            ha="center", fontsize=9, fontweight="bold",
                            color=color)

    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=10)
    ax.set_ylabel("Metric value")
    ax.set_ylim(0.20, 0.75)
    ax.set_title(
        "Retrieval metrics progression across ablation steps  (n = 20 questions)",
        fontsize=12, pad=12,
    )
    ax.grid(True, axis="y", alpha=0.3)
    ax.legend(loc="lower right", fontsize=9, ncol=2, framealpha=0.92)

    delta_mrr = series["mrr"][-1] - series["mrr"][0]
    delta_pct = delta_mrr / series["mrr"][0] * 100
    ax.text(
        0.01, 0.97,
        f"Δ MRR  = +{delta_mrr:.3f}  (+{delta_pct:.0f}%)",
        transform=ax.transAxes, fontsize=10, va="top",
        bbox=dict(boxstyle="round,pad=0.4", facecolor="#f4f4f4",
                  edgecolor="#cccccc"),
    )

    fig.tight_layout()
    out = FIG_DIR / "metrics_progression.png"
    fig.savefig(out, dpi=150)
    print(f"Saved: {out.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
