"""Evaluate Hit@K for 4 recommender strategies on the same synthetic hold-out.

Reuses the model trained by run_dkt.py (results/dkt_model.pt). If the weights
file is missing it raises a clear error rather than silently re-training.

Usage:
    python3 run_dkt.py            # produces results/dkt_model.pt
    python3 run_recommender.py    # produces results/recommender_baseline.json
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import List

import numpy as np

from bkt import generate_synthetic
from dkt import StudentTrace, pick_device
from recommender import (
    _per_step_dkt_probs,
    dkt_uncertainty_topk,
    dkt_zpd_topk,
    evaluate_hit_at_k,
    load_dkt,
    most_frequent_state,
    most_frequent_topk,
    random_state,
    random_topk,
    sticky_topk,
)

OUT_DIR = Path(__file__).parent / "results"
OUT_JSON = OUT_DIR / "recommender_baseline.json"
WEIGHTS = OUT_DIR / "dkt_model.pt"

N_STUDENTS = 500
N_CONCEPTS = 24
ATTEMPTS_LAMBDA = 30.0
TRAIN_FRAC = 0.8
SEED = 42
K_LIST = (1, 3, 5, 10)
ZPD_TARGET_P = 0.7


def main() -> None:
    if not WEIGHTS.exists():
        raise SystemExit(
            f"[recommender] weights not found at {WEIGHTS}.\n"
            "Run `python3 run_dkt.py` first to train and save the model."
        )

    device = pick_device()
    print(f"[recommender] device={device}")
    t0 = time.time()

    # Same synthetic, same split as run_dkt.py
    sequences, _true = generate_synthetic(
        n_students=N_STUDENTS, n_concepts=N_CONCEPTS,
        attempts_lambda=ATTEMPTS_LAMBDA, seed=SEED,
    )
    rng = np.random.default_rng(SEED)
    ids = np.arange(N_STUDENTS)
    rng.shuffle(ids)
    n_train = int(TRAIN_FRAC * N_STUDENTS)
    train_ids = ids[:n_train]
    test_ids = ids[n_train:]

    interleave_rng = np.random.default_rng(SEED + 1)
    train_traces: List[StudentTrace] = [
        StudentTrace.from_per_concept(sequences[s], interleave_rng) for s in train_ids
    ]
    test_traces: List[StudentTrace] = [
        StudentTrace.from_per_concept(sequences[s], interleave_rng) for s in test_ids
    ]
    print(f"[recommender] split: {len(train_traces)} train / {len(test_traces)} test")

    # Load model + compute per-step DKT probs for test once (reused across strategies)
    model = load_dkt(str(WEIGHTS), device)
    per_step = _per_step_dkt_probs(model, test_traces, N_CONCEPTS, device)

    # Strategies
    strategies = [
        (
            "Random",
            random_topk,
            random_state(N_CONCEPTS, seed=SEED + 2),
            None,
            "uniform top-K, reference floor",
        ),
        (
            "Most-frequent",
            most_frequent_topk,
            most_frequent_state(train_traces, N_CONCEPTS),
            None,
            "population prior, no personalization",
        ),
        (
            "Sticky (last concept)",
            sticky_topk,
            {"n_concepts": N_CONCEPTS},
            None,
            "behavioral baseline — students tend to stay on the same concept",
        ),
        (
            "DKT-ZPD (P≈0.7)",
            lambda st, p, K, tr, t: dkt_zpd_topk(st, p, K, target_p=ZPD_TARGET_P, _tr=tr, _t=t),
            {},
            per_step,
            "rank concepts by closeness to 0.7 — Vygotsky's zone of proximal development",
        ),
        (
            "DKT-uncertainty (P≈0.5)",
            dkt_uncertainty_topk,
            {},
            per_step,
            "rank concepts by closeness to 0.5 — max information gain per attempt",
        ),
    ]

    summary = []
    for name, fn, state, probs, note in strategies:
        hits = evaluate_hit_at_k(test_traces, probs, fn, state, K_LIST)
        row = {"name": name, "note": note, **{f"hit@{K}": round(hits[K], 4) for K in K_LIST}}
        summary.append(row)
        printable = " · ".join(f"H@{K}={hits[K]:.4f}" for K in K_LIST)
        print(f"[recommender] {name:25s} → {printable}")

    elapsed = time.time() - t0
    payload = {
        "model": "DKT-based next-concept recommender",
        "data": "synthetic_seed_42",
        "n_concepts": N_CONCEPTS,
        "split": {"train": len(train_traces), "test": len(test_traces), "by": "student_id"},
        "k_list": list(K_LIST),
        "zpd_target_p": ZPD_TARGET_P,
        "strategies": summary,
        "random_floor_expected": {f"hit@{K}": round(K / N_CONCEPTS, 4) for K in K_LIST},
        "elapsed_sec": round(elapsed, 1),
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    print(f"[recommender] wrote {OUT_JSON.relative_to(Path.cwd())} in {elapsed:.1f}s")


if __name__ == "__main__":
    main()
