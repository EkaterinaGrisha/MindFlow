"""Train DKT baseline on the *same* synthetic data as run_baseline.py.

Reproducible: same seed, same train/test split by student_id, same n_students,
same n_concepts.  This keeps DKT-vs-BKT numbers directly comparable.

Usage:
    python3 run_dkt.py

Writes results/dkt_baseline.json + results/bkt_vs_dkt.json
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import List

import numpy as np
import torch

from bkt import generate_synthetic
from dkt import (
    StudentTrace,
    evaluate_dkt,
    pick_device,
    train_dkt,
)

OUT_DIR = Path(__file__).parent / "results"
OUT_DKT = OUT_DIR / "dkt_baseline.json"
OUT_VS = OUT_DIR / "bkt_vs_dkt.json"
OUT_WEIGHTS = OUT_DIR / "dkt_model.pt"

N_STUDENTS = 500
N_CONCEPTS = 24
ATTEMPTS_LAMBDA = 30.0
TRAIN_FRAC = 0.8
SEED = 42
EMBED_DIM = 50
HIDDEN_DIM = 64
DROPOUT = 0.2
EPOCHS = 30
BATCH_SIZE = 32
LR = 1e-3


def main() -> None:
    device = pick_device()
    print(
        f"[DKT baseline] synth: {N_STUDENTS} students × {N_CONCEPTS} concepts × "
        f"~{ATTEMPTS_LAMBDA:.0f} attempts, seed={SEED}, device={device}"
    )
    t0 = time.time()

    # 1. Same synthetic source as BKT — already reproducible by seed.
    sequences, _true_params = generate_synthetic(
        n_students=N_STUDENTS,
        n_concepts=N_CONCEPTS,
        attempts_lambda=ATTEMPTS_LAMBDA,
        seed=SEED,
    )

    # 2. Same student-id split as BKT (same shuffle order under seed=42).
    rng = np.random.default_rng(SEED)
    student_ids = np.arange(N_STUDENTS)
    rng.shuffle(student_ids)
    n_train = int(TRAIN_FRAC * N_STUDENTS)
    train_ids = student_ids[:n_train]
    test_ids = student_ids[n_train:]

    # 3. Interleave per-concept sequences → chronological per-student traces.
    interleave_rng = np.random.default_rng(SEED + 1)
    train_traces: List[StudentTrace] = [
        StudentTrace.from_per_concept(sequences[s], interleave_rng) for s in train_ids
    ]
    test_traces: List[StudentTrace] = [
        StudentTrace.from_per_concept(sequences[s], interleave_rng) for s in test_ids
    ]
    avg_len = np.mean([tr.length for tr in train_traces])
    print(f"[DKT baseline] split: {len(train_traces)} train / {len(test_traces)} test · avg seq len {avg_len:.0f}")

    # 4. Train.
    model, losses = train_dkt(
        train_traces,
        N_CONCEPTS,
        device=device,
        embed_dim=EMBED_DIM,
        hidden_dim=HIDDEN_DIM,
        dropout=DROPOUT,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        lr=LR,
        seed=SEED,
        val_traces=test_traces,
        verbose=True,
    )

    # 5. Final evaluation.
    auc, acc, rmse = evaluate_dkt(model, test_traces, N_CONCEPTS, device=device)
    elapsed = time.time() - t0
    n_params = sum(p.numel() for p in model.parameters())
    print(
        f"[DKT baseline] AUC={auc:.4f} · ACC={acc:.4f} · RMSE={rmse:.4f} · "
        f"params={n_params} · {elapsed:.1f}s"
    )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "model": "DKT_piech_lstm",
        "data": "synthetic",
        "n_students": N_STUDENTS,
        "n_concepts": N_CONCEPTS,
        "attempts_lambda": ATTEMPTS_LAMBDA,
        "split": {"train": len(train_traces), "test": len(test_traces), "by": "student_id"},
        "arch": {
            "embed_dim": EMBED_DIM,
            "hidden_dim": HIDDEN_DIM,
            "lstm_layers": 1,
            "dropout": DROPOUT,
            "n_params": n_params,
        },
        "train": {
            "epochs": EPOCHS,
            "batch_size": BATCH_SIZE,
            "lr": LR,
            "optimizer": "Adam",
            "loss": "BCEWithLogits",
            "grad_clip": 5.0,
            "device": str(device),
            "seed": SEED,
        },
        "metrics": {
            "auc": round(auc, 4),
            "accuracy": round(acc, 4),
            "rmse": round(rmse, 4),
        },
        "training_loss_curve": [round(x, 5) for x in losses],
        "elapsed_sec": round(elapsed, 1),
    }
    OUT_DKT.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    print(f"[DKT baseline] wrote {OUT_DKT.relative_to(Path.cwd())}")

    # save model weights so the recommender (run_recommender.py) can reuse them
    torch.save(
        {
            "state_dict": model.state_dict(),
            "arch": payload["arch"],
            "n_concepts": N_CONCEPTS,
        },
        OUT_WEIGHTS,
    )
    print(f"[DKT baseline] saved weights to {OUT_WEIGHTS.relative_to(Path.cwd())}")

    # 6. Comparative summary against BKT (if BKT baseline exists).
    bkt_path = OUT_DIR / "bkt_baseline.json"
    if bkt_path.exists():
        bkt = json.loads(bkt_path.read_text())
        comparison = {
            "data": "synthetic_seed_42",
            "split": payload["split"],
            "models": [
                {
                    "name": "BKT (classic, EM)",
                    "auc": bkt["metrics"]["auc"],
                    "accuracy": bkt["metrics"]["accuracy"],
                    "rmse": bkt["metrics"]["rmse"],
                    "elapsed_sec": bkt["elapsed_sec"],
                    "params": "4 per concept × 24 = 96 scalars",
                },
                {
                    "name": "DKT (Piech, LSTM)",
                    "auc": payload["metrics"]["auc"],
                    "accuracy": payload["metrics"]["accuracy"],
                    "rmse": payload["metrics"]["rmse"],
                    "elapsed_sec": payload["elapsed_sec"],
                    "params": f"{n_params} learnable",
                },
            ],
            "delta_auc": round(payload["metrics"]["auc"] - bkt["metrics"]["auc"], 4),
            "note": (
                "Synthetic data is generated by single-skill BKT (no cross-concept transfer), "
                "so DKT lacks shared structure to exploit — parity or small gain is expected; "
                "real-world advantage of DKT (zero-shot for new concepts, scaling) will only "
                "show on production telemetry once accumulated."
            ),
        }
        OUT_VS.write_text(json.dumps(comparison, indent=2, ensure_ascii=False))
        print(f"[DKT baseline] wrote {OUT_VS.relative_to(Path.cwd())}")


if __name__ == "__main__":
    main()
