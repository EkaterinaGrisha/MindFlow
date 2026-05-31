"""DKT-based next-concept recommender — baseline strategies + Hit@K evaluator.

Given a partial student history (sequence of past attempts on various concepts),
return a top-K ranked list of concept_ids to recommend next.

Strategies
----------
1. **Random** — uniform K-without-replacement. Reference floor.
2. **Most-frequent** — recommends the most popular concepts in the train set
   (population prior, no personalization).
3. **DKT-ZPD** — uses the trained DKT to predict P(correct) for every concept
   at the next step, then ranks by closeness to ``target_p`` (default 0.7,
   Vygotsky's zone-of-proximal-development heuristic). Concepts the student is
   *about* to be able to solve get priority.
4. **DKT-uncertainty** — ranks by closeness to P=0.5 (maximally informative
   item under a Bernoulli observation model). Each attempt yields the largest
   expected reduction in posterior uncertainty.

Why two DKT strategies
----------------------
ZPD is *pedagogically* sensible (the student is challenged but succeeds).
Max-uncertainty is *information-theoretically* sensible (each attempt teaches
the model the most). They're both worth measuring — they answer different
product questions.

Metric
------
**Hit@K** — fraction of positions in the hold-out where the student's actual
next concept appears in the model's top-K recommendation. Evaluated on every
position 0..T-2 of every test trace (not just the final attempt).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List, Optional, Sequence

import numpy as np
import torch

from dkt import DKTModel, StudentTrace, collate_traces


# ── Strategy type ───────────────────────────────────────────────────────


@dataclass
class TopK:
    indices: np.ndarray  # (K,) int — concept ids in score order, best first

    def contains(self, true_c: int) -> bool:
        return bool((self.indices == true_c).any())


RecommenderState = Dict[str, object]  # opaque per-strategy state


# ── Strategy 1: Random ──────────────────────────────────────────────────


def random_state(n_concepts: int, seed: int = 0) -> RecommenderState:
    return {"n_concepts": n_concepts, "rng": np.random.default_rng(seed)}


def random_topk(state: RecommenderState, _per_step: np.ndarray, K: int, _tr: Optional[StudentTrace] = None, _t: int = 0) -> TopK:
    n = int(state["n_concepts"])  # type: ignore[arg-type]
    rng = state["rng"]  # type: ignore[assignment]
    picked = rng.choice(n, size=min(K, n), replace=False)  # type: ignore[union-attr]
    return TopK(indices=np.asarray(picked, dtype=int))


# ── Strategy 2: Most-frequent (population prior) ────────────────────────


def most_frequent_state(train_traces: List[StudentTrace], n_concepts: int) -> RecommenderState:
    counts = np.zeros(n_concepts, dtype=np.int64)
    for tr in train_traces:
        for c in tr.concept_idx:
            counts[c] += 1
    return {"order": np.argsort(-counts)}


def most_frequent_topk(state: RecommenderState, _per_step: np.ndarray, K: int, _tr: Optional[StudentTrace] = None, _t: int = 0) -> TopK:
    order = state["order"]  # type: ignore[assignment]
    return TopK(indices=np.asarray(order[:K], dtype=int))  # type: ignore[index]


# ── Strategy 5: Sticky (behavioral baseline) ────────────────────────────


def sticky_topk(_state: RecommenderState, _per_step: np.ndarray, K: int, tr: Optional[StudentTrace] = None, t: int = 0) -> TopK:
    """Recommend the *current* concept first, then random fillers.

    Pure behavioral baseline: in real product telemetry students rarely jump
    concepts every attempt, so guessing "they'll do the same as last time"
    is a very strong baseline for Hit@K. This is *not* a pedagogical
    recommender — it's the floor any pedagogical recommender must beat to
    claim it's adding value over passive observation.
    """
    if tr is None:
        return TopK(indices=np.arange(min(K, 1), dtype=int))
    last_c = int(tr.concept_idx[t])
    if K == 1:
        return TopK(indices=np.array([last_c], dtype=int))
    # fill rest with deterministic other indices to avoid stochastic noise
    rest = [c for c in range(_state.get("n_concepts", 24) if isinstance(_state, dict) else 24) if c != last_c]
    return TopK(indices=np.array([last_c] + rest[: K - 1], dtype=int))


# ── Strategy 3 & 4: DKT-based ───────────────────────────────────────────


def dkt_zpd_topk(_state: RecommenderState, p_correct_per_concept: np.ndarray, K: int, target_p: float = 0.7, _tr: Optional[StudentTrace] = None, _t: int = 0) -> TopK:
    """Rank concepts by closeness to target_p (ZPD); top-K best-first."""
    distance = np.abs(p_correct_per_concept - target_p)
    order = np.argsort(distance)
    return TopK(indices=order[:K])


def dkt_uncertainty_topk(_state: RecommenderState, p_correct_per_concept: np.ndarray, K: int, _tr: Optional[StudentTrace] = None, _t: int = 0) -> TopK:
    """Rank concepts by closeness to P=0.5 (max Bernoulli uncertainty)."""
    distance = np.abs(p_correct_per_concept - 0.5)
    order = np.argsort(distance)
    return TopK(indices=order[:K])


# ── Hit@K evaluator ─────────────────────────────────────────────────────


@torch.no_grad()
def _per_step_dkt_probs(
    model: DKTModel,
    traces: List[StudentTrace],
    n_concepts: int,
    device: torch.device,
    batch_size: int = 64,
) -> List[np.ndarray]:
    """For every trace, return shape-(T, K) P(correct) predictions per step."""
    model.eval()
    out: List[np.ndarray] = []
    for i in range(0, len(traces), batch_size):
        batch = traces[i : i + batch_size]
        x, lengths, _next_c, _next_y = collate_traces(batch, n_concepts, device)
        logits = model(x, lengths)        # (B, T_max, K)
        probs = torch.sigmoid(logits).cpu().numpy()
        for b, tr in enumerate(batch):
            out.append(probs[b, : tr.length, :])
    return out


def evaluate_hit_at_k(
    traces: List[StudentTrace],
    per_trace_probs: Optional[Sequence[np.ndarray]],
    strategy_fn: Callable[..., TopK],
    state: RecommenderState,
    K_list: Sequence[int],
) -> Dict[int, float]:
    """Returns {K: Hit@K} averaged over all positions in all traces.

    `per_trace_probs` is only used by DKT-based strategies; pass None otherwise.
    Strategy callable receives ``(state, p_at_t, K, trace, t)`` so trace-aware
    strategies (e.g. Sticky) can inspect the current step's concept.
    """
    hits = {K: 0 for K in K_list}
    total = 0
    for ti, tr in enumerate(traces):
        T = tr.length
        if T < 2:
            continue
        probs = per_trace_probs[ti] if per_trace_probs is not None else None
        for t in range(T - 1):
            p_at_t = probs[t] if probs is not None else np.zeros(0)
            true_next = int(tr.concept_idx[t + 1])
            for K in K_list:
                topk = strategy_fn(state, p_at_t, K, tr, t)
                if topk.contains(true_next):
                    hits[K] += 1
            total += 1
    return {K: (hits[K] / total) if total > 0 else 0.0 for K in K_list}


# ── Convenience entry point ─────────────────────────────────────────────


def load_dkt(weights_path: str, device: torch.device) -> DKTModel:
    """Load a DKTModel saved by run_dkt.py."""
    blob = torch.load(weights_path, map_location=device, weights_only=False)
    arch = blob["arch"]
    n_concepts = int(blob["n_concepts"])
    model = DKTModel(
        n_concepts=n_concepts,
        embed_dim=int(arch["embed_dim"]),
        hidden_dim=int(arch["hidden_dim"]),
        dropout=float(arch.get("dropout", 0.2)),
    ).to(device)
    model.load_state_dict(blob["state_dict"])
    model.eval()
    return model
