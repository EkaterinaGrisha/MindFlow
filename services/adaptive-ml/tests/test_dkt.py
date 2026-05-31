"""Sanity tests for the DKT baseline."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402
import torch  # noqa: E402

from bkt import generate_synthetic  # noqa: E402
from dkt import (  # noqa: E402
    DKTModel,
    StudentTrace,
    collate_traces,
    evaluate_dkt,
    pick_device,
    train_dkt,
)


class TestDkt(unittest.TestCase):

    def test_model_output_shape(self) -> None:
        model = DKTModel(n_concepts=4, embed_dim=8, hidden_dim=16, dropout=0.0)
        x = torch.tensor([[0, 3, 5, 1, 2]], dtype=torch.long)
        lengths = torch.tensor([5], dtype=torch.long)
        out = model(x, lengths)
        self.assertEqual(out.shape, (1, 5, 4))

    def test_interleave_preserves_per_concept_order(self) -> None:
        rng = np.random.default_rng(7)
        per_concept = [[1, 0, 1], [0, 1], [1, 1, 1, 0]]
        trace = StudentTrace.from_per_concept(per_concept, rng)
        # for each concept, the relative order of correct/incorrect must match
        for c in range(len(per_concept)):
            picked = [trace.correct[i] for i in range(trace.length) if trace.concept_idx[i] == c]
            self.assertEqual(picked, per_concept[c])

    def test_overfits_tiny_synthetic(self) -> None:
        """20 students, 4 concepts → loss must drop substantially in 5 epochs."""
        device = pick_device()
        sequences, _ = generate_synthetic(
            n_students=20, n_concepts=4, attempts_lambda=12.0, seed=11,
        )
        rng = np.random.default_rng(11)
        traces = [StudentTrace.from_per_concept(sequences[s], rng) for s in range(20)]
        _model, losses = train_dkt(
            traces, n_concepts=4, device=device,
            embed_dim=16, hidden_dim=32, dropout=0.0,
            epochs=5, batch_size=8, lr=5e-3, seed=11, verbose=False,
        )
        # last epoch loss should be meaningfully smaller than first
        self.assertLess(losses[-1], losses[0])

    def test_evaluate_returns_sane_metrics(self) -> None:
        device = pick_device()
        sequences, _ = generate_synthetic(
            n_students=30, n_concepts=4, attempts_lambda=15.0, seed=13,
        )
        rng = np.random.default_rng(13)
        traces = [StudentTrace.from_per_concept(sequences[s], rng) for s in range(30)]
        model, _ = train_dkt(
            traces[:24], n_concepts=4, device=device,
            embed_dim=16, hidden_dim=32, dropout=0.0,
            epochs=5, batch_size=8, lr=5e-3, seed=13, verbose=False,
        )
        auc, acc, rmse = evaluate_dkt(model, traces[24:], n_concepts=4, device=device)
        self.assertGreaterEqual(auc, 0.0)
        self.assertLessEqual(auc, 1.0)
        self.assertGreaterEqual(acc, 0.0)
        self.assertLessEqual(acc, 1.0)
        self.assertGreaterEqual(rmse, 0.0)
        self.assertLessEqual(rmse, 1.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
