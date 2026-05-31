"""Sanity tests for the next-concept recommender."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402

from dkt import StudentTrace  # noqa: E402
from recommender import (  # noqa: E402
    dkt_uncertainty_topk,
    dkt_zpd_topk,
    evaluate_hit_at_k,
    most_frequent_state,
    most_frequent_topk,
    random_state,
    random_topk,
    sticky_topk,
)


class TestRecommender(unittest.TestCase):

    def test_random_topk_returns_k_unique(self) -> None:
        state = random_state(n_concepts=10, seed=1)
        topk = random_topk(state, np.zeros(0), K=5)
        self.assertEqual(len(topk.indices), 5)
        self.assertEqual(len(set(topk.indices.tolist())), 5)

    def test_most_frequent_orders_by_count(self) -> None:
        # Concept 2 dominates → should be #1; concept 0 appears once → likely last
        traces = [
            StudentTrace(concept_idx=np.array([0, 2, 2, 2]), correct=np.array([1, 1, 0, 1]), length=4),
            StudentTrace(concept_idx=np.array([1, 2, 2]),    correct=np.array([1, 1, 1]),    length=3),
        ]
        state = most_frequent_state(traces, n_concepts=3)
        topk = most_frequent_topk(state, np.zeros(0), K=3)
        self.assertEqual(topk.indices[0], 2)

    def test_dkt_zpd_prefers_target_p(self) -> None:
        probs = np.array([0.95, 0.71, 0.5, 0.1])
        topk = dkt_zpd_topk({}, probs, K=2, target_p=0.7)
        # 0.71 is closest, 0.5 next
        self.assertEqual(topk.indices[0], 1)
        self.assertEqual(topk.indices[1], 2)

    def test_dkt_uncertainty_prefers_p_05(self) -> None:
        probs = np.array([0.95, 0.51, 0.2])
        topk = dkt_uncertainty_topk({}, probs, K=1)
        self.assertEqual(topk.indices[0], 1)

    def test_sticky_returns_current_concept_first(self) -> None:
        trace = StudentTrace(
            concept_idx=np.array([3, 1, 2, 0]),
            correct=np.array([1, 0, 1, 1]),
            length=4,
        )
        topk = sticky_topk({"n_concepts": 4}, np.zeros(0), K=2, tr=trace, t=1)
        # at t=1 current concept is 1 → first slot must be 1
        self.assertEqual(topk.indices[0], 1)

    def test_hit_at_k_counts_correctly(self) -> None:
        # concept 2 appears 3 times → strong winner of most-frequent.
        # Transitions: t=0 next=2 (hit), t=1 next=0 (miss), t=2 next=2 (hit).
        trace = StudentTrace(
            concept_idx=np.array([2, 2, 0, 2]),
            correct=np.array([1, 1, 0, 1]),
            length=4,
        )
        state = most_frequent_state([trace], n_concepts=3)
        hits = evaluate_hit_at_k([trace], None, most_frequent_topk, state, K_list=(1,))
        self.assertAlmostEqual(hits[1], 2.0 / 3.0, places=4)


if __name__ == "__main__":
    unittest.main(verbosity=2)
