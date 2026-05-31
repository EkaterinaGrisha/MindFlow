"""Train classic BKT on synthetic data and write metrics to results/bkt_baseline.json.

Usage:
    python3 run_baseline.py

Reproducible: fixed seed throughout.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import List

import numpy as np
from sklearn.metrics import accuracy_score, mean_squared_error, roc_auc_score

from bkt import (
    BktParams,
    fit_em,
    generate_synthetic,
    predict_next_correct,
)

OUT_DIR = Path(__file__).parent / "results"
OUT_JSON = OUT_DIR / "bkt_baseline.json"

N_STUDENTS = 500
N_CONCEPTS = 24
ATTEMPTS_LAMBDA = 30.0
TRAIN_FRAC = 0.8
EM_ITERS = 30
SEED = 42


def main() -> None:
    print(
        f"[BKT baseline] synth: {N_STUDENTS} students × {N_CONCEPTS} concepts × "
        f"~{ATTEMPTS_LAMBDA:.0f} attempts, seed={SEED}"
    )
    t0 = time.time()

    sequences, true_params = generate_synthetic(
        n_students=N_STUDENTS,
        n_concepts=N_CONCEPTS,
        attempts_lambda=ATTEMPTS_LAMBDA,
        seed=SEED,
    )

    rng = np.random.default_rng(SEED)
    student_ids = np.arange(N_STUDENTS)
    rng.shuffle(student_ids)
    n_train = int(TRAIN_FRAC * N_STUDENTS)
    train_ids = set(student_ids[:n_train].tolist())
    test_ids = student_ids[n_train:].tolist()

    print(f"[BKT baseline] split: {n_train} train / {N_STUDENTS - n_train} test")

    # ── EM-fit per concept on TRAIN students ────────────────────────────────
    fitted: List[BktParams] = []
    for c in range(N_CONCEPTS):
        train_seqs = [sequences[s][c] for s in range(N_STUDENTS) if s in train_ids]
        params, ll = fit_em(train_seqs, n_iter=EM_ITERS)
        fitted.append(params)

    # ── Honest one-step-ahead prediction on HOLD-OUT students ──────────────
    y_true_all: List[int] = []
    y_pred_all: List[float] = []
    for s in test_ids:
        for c in range(N_CONCEPTS):
            seq = sequences[s][c]
            preds = predict_next_correct(seq, fitted[c])
            y_true_all.extend(seq)
            y_pred_all.extend(preds)

    y_true = np.array(y_true_all, dtype=int)
    y_pred = np.array(y_pred_all, dtype=float)
    y_pred_clip = np.clip(y_pred, 1e-6, 1 - 1e-6)

    auc = float(roc_auc_score(y_true, y_pred))
    acc = float(accuracy_score(y_true, (y_pred_clip > 0.5).astype(int)))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred_clip)))
    # average param recovery error vs ground truth
    param_mae = float(
        np.mean(
            [
                abs(fitted[c].p_init - true_params[c].p_init)
                + abs(fitted[c].p_learn - true_params[c].p_learn)
                + abs(fitted[c].p_slip - true_params[c].p_slip)
                + abs(fitted[c].p_guess - true_params[c].p_guess)
                for c in range(N_CONCEPTS)
            ]
        ) / 4.0
    )

    elapsed = time.time() - t0
    print(
        f"[BKT baseline] AUC={auc:.4f} · ACC={acc:.4f} · RMSE={rmse:.4f} · "
        f"param_MAE={param_mae:.4f} · {elapsed:.1f}s"
    )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "model": "BKT_classic_em",
        "data": "synthetic",
        "n_students": N_STUDENTS,
        "n_concepts": N_CONCEPTS,
        "attempts_lambda": ATTEMPTS_LAMBDA,
        "split": {"train": n_train, "test": N_STUDENTS - n_train, "by": "student_id"},
        "em_iters": EM_ITERS,
        "seed": SEED,
        "metrics": {
            "auc": round(auc, 4),
            "accuracy": round(acc, 4),
            "rmse": round(rmse, 4),
            "param_mae": round(param_mae, 4),
        },
        "fitted_params_sample": [
            {
                "concept_idx": c,
                "fitted": {
                    "p_init": round(fitted[c].p_init, 3),
                    "p_learn": round(fitted[c].p_learn, 3),
                    "p_slip": round(fitted[c].p_slip, 3),
                    "p_guess": round(fitted[c].p_guess, 3),
                },
                "true": {
                    "p_init": round(true_params[c].p_init, 3),
                    "p_learn": round(true_params[c].p_learn, 3),
                    "p_slip": round(true_params[c].p_slip, 3),
                    "p_guess": round(true_params[c].p_guess, 3),
                },
            }
            for c in range(min(4, N_CONCEPTS))
        ],
        "elapsed_sec": round(elapsed, 1),
    }
    OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    print(f"[BKT baseline] wrote {OUT_JSON.relative_to(Path.cwd())}")


if __name__ == "__main__":
    main()
