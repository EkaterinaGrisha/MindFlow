"""Sanity tests for the BKT baseline.

Run from the package root:

    python3 -m unittest discover services/adaptive-ml/tests -v
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from bkt import (  # noqa: E402
    BktParams,
    fit_em,
    forward_alpha,
    generate_synthetic,
    predict_next_correct,
)


class TestBkt(unittest.TestCase):

    def test_forward_returns_proper_distribution(self) -> None:
        p = BktParams(0.3, 0.15, 0.1, 0.2)
        seq = [1, 0, 1, 1, 0]
        alpha, _ll = forward_alpha(seq, p)
        # each row sums to 1
        for row in alpha:
            self.assertAlmostEqual(float(row.sum()), 1.0, places=5)

    def test_predict_returns_one_per_step(self) -> None:
        p = BktParams(0.3, 0.15, 0.1, 0.2)
        seq = [1, 0, 1, 1, 0, 1]
        preds = predict_next_correct(seq, p)
        self.assertEqual(len(preds), len(seq))
        for pred in preds:
            self.assertTrue(0.0 <= pred <= 1.0)

    def test_em_recovers_params_within_tolerance_on_small_synthetic(self) -> None:
        # 100 students × 1 concept × ~25 attempts → EM should land near the truth
        sequences, true_params = generate_synthetic(
            n_students=100, n_concepts=1, attempts_lambda=25.0, seed=123,
        )
        seqs = [sequences[s][0] for s in range(100)]
        fitted, _ll = fit_em(seqs, n_iter=40)
        # each param within 0.15 of truth — loose because n=100 is small
        self.assertLess(abs(fitted.p_slip - true_params[0].p_slip), 0.15)
        self.assertLess(abs(fitted.p_guess - true_params[0].p_guess), 0.15)


if __name__ == "__main__":
    unittest.main(verbosity=2)
