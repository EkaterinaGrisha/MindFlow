"""Classic Bayesian Knowledge Tracing — synthetic data generator + EM-fit + forward predict.

Single-skill BKT per concept. Latent state L_t ∈ {0=not known, 1=known}.
Transition: no forgetting (P(L_t+1=1 | L_t=1) = 1).
Emission: P(y=correct | L=1) = 1 - p_slip ;  P(y=correct | L=0) = p_guess.

This module is self-contained — only numpy.  scikit-learn is used by the
evaluation helper in run_baseline.py (kept out of this file to keep the BKT
core dependency-light and easy to vendor into other notebooks).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import numpy as np


# ── Parameter container ────────────────────────────────────────────────────


@dataclass
class BktParams:
    p_init: float   # P(L_0 = 1)
    p_learn: float  # P(L_t+1 = 1 | L_t = 0)
    p_slip: float   # P(y = incorrect | L = 1)
    p_guess: float  # P(y = correct   | L = 0)

    def as_tuple(self) -> Tuple[float, float, float, float]:
        return (self.p_init, self.p_learn, self.p_slip, self.p_guess)


# ── Synthetic generator ────────────────────────────────────────────────────


def _draw_true_params(rng: np.random.Generator) -> BktParams:
    """Realistic per-concept priors with noise. See README for rationale."""
    return BktParams(
        p_init=float(rng.uniform(0.20, 0.40)),
        p_learn=float(rng.uniform(0.10, 0.25)),
        p_slip=float(rng.uniform(0.05, 0.15)),
        p_guess=float(rng.uniform(0.15, 0.25)),
    )


def generate_synthetic(
    n_students: int = 500,
    n_concepts: int = 24,
    attempts_lambda: float = 30.0,
    seed: int = 42,
) -> Tuple[List[List[List[int]]], List[BktParams]]:
    """Generate per-(student, concept) attempt sequences.

    Returns
    -------
    sequences : [n_students][n_concepts] list of list of 0/1 ints
        sequences[s][c] is the chronological sequence of correct/incorrect
        answers for student s on concept c. Length is Poisson(attempts_lambda),
        clipped to [5, 60] so EM has enough signal but no pathological tails.
    true_params : [n_concepts] BktParams
        Ground-truth parameters per concept used to generate the data.
    """
    rng = np.random.default_rng(seed)
    true_params: List[BktParams] = [_draw_true_params(rng) for _ in range(n_concepts)]

    sequences: List[List[List[int]]] = []
    for _ in range(n_students):
        per_student: List[List[int]] = []
        for c in range(n_concepts):
            p = true_params[c]
            t_len = int(np.clip(rng.poisson(attempts_lambda), 5, 60))
            L = 1 if rng.random() < p.p_init else 0
            seq: List[int] = []
            for _ in range(t_len):
                if L == 1:
                    y = 1 if rng.random() < (1 - p.p_slip) else 0
                else:
                    y = 1 if rng.random() < p.p_guess else 0
                seq.append(y)
                # transition AFTER emission
                if L == 0 and rng.random() < p.p_learn:
                    L = 1
            per_student.append(seq)
        sequences.append(per_student)
    return sequences, true_params


# ── BKT forward-backward (one concept, one sequence) ───────────────────────


def _emission(y: int, p: BktParams) -> Tuple[float, float]:
    """Return (P(y | L=0), P(y | L=1))."""
    if y == 1:
        return p.p_guess, 1.0 - p.p_slip
    return 1.0 - p.p_guess, p.p_slip


def forward_alpha(seq: List[int], p: BktParams) -> Tuple[np.ndarray, float]:
    """Filter posteriors alpha[t, L=k] = P(L_t = k | y_1..t).

    Also returns log-likelihood of the observation sequence.
    """
    T = len(seq)
    alpha = np.zeros((T, 2))
    log_lik = 0.0

    # t = 0
    e0, e1 = _emission(seq[0], p)
    alpha[0, 0] = (1.0 - p.p_init) * e0
    alpha[0, 1] = p.p_init * e1
    c = alpha[0].sum()
    if c > 0:
        alpha[0] /= c
        log_lik += np.log(c)

    for t in range(1, T):
        e0, e1 = _emission(seq[t], p)
        # predict L_t before observing
        pred_L0 = alpha[t - 1, 0] * (1.0 - p.p_learn)
        pred_L1 = alpha[t - 1, 0] * p.p_learn + alpha[t - 1, 1] * 1.0
        # update
        alpha[t, 0] = pred_L0 * e0
        alpha[t, 1] = pred_L1 * e1
        c = alpha[t].sum()
        if c > 0:
            alpha[t] /= c
            log_lik += np.log(c)
    return alpha, log_lik


def _backward_beta(seq: List[int], p: BktParams) -> np.ndarray:
    T = len(seq)
    beta = np.ones((T, 2))
    for t in range(T - 2, -1, -1):
        e0, e1 = _emission(seq[t + 1], p)
        beta[t, 1] = beta[t + 1, 1] * 1.0 * e1
        beta[t, 0] = (
            beta[t + 1, 0] * (1.0 - p.p_learn) * e0
            + beta[t + 1, 1] * p.p_learn * e1
        )
        s = beta[t].sum()
        if s > 0:
            beta[t] /= s
    return beta


# ── EM fit (one concept, many student sequences) ──────────────────────────


def fit_em(
    seqs: List[List[int]],
    n_iter: int = 30,
    init: BktParams = BktParams(0.25, 0.15, 0.10, 0.20),
) -> Tuple[BktParams, float]:
    """Fit BKT params to a list of sequences (one concept, many students).

    Returns the fitted BktParams plus final-iteration total log-likelihood.
    """
    p = BktParams(*init.as_tuple())
    last_ll = -np.inf

    for _iter in range(n_iter):
        # accumulators
        num_init = 0.0
        den_init = 0.0
        num_learn = 0.0
        den_learn = 0.0
        num_slip = 0.0
        den_slip = 0.0
        num_guess = 0.0
        den_guess = 0.0
        total_ll = 0.0

        for seq in seqs:
            T = len(seq)
            if T == 0:
                continue
            alpha, ll = forward_alpha(seq, p)
            beta = _backward_beta(seq, p)
            total_ll += ll

            # gamma[t, k] = P(L_t = k | y_1..T), normalized
            gamma = alpha * beta
            gamma /= gamma.sum(axis=1, keepdims=True) + 1e-12

            # p_init from gamma[0]
            num_init += gamma[0, 1]
            den_init += 1.0

            # p_learn from xi over (L_t=0 → L_t+1=1) vs (L_t=0 → L_t+1=0)
            for t in range(T - 1):
                e0_next, e1_next = _emission(seq[t + 1], p)
                xi_00 = alpha[t, 0] * (1.0 - p.p_learn) * e0_next * beta[t + 1, 0]
                xi_01 = alpha[t, 0] * p.p_learn * e1_next * beta[t + 1, 1]
                xi_11 = alpha[t, 1] * 1.0 * e1_next * beta[t + 1, 1]
                norm = xi_00 + xi_01 + xi_11 + 1e-12
                xi_00 /= norm
                xi_01 /= norm
                num_learn += xi_01
                den_learn += xi_00 + xi_01

            # p_slip / p_guess from emissions
            for t in range(T):
                y = seq[t]
                # p_slip = P(y=incorrect | L=1)
                den_slip += gamma[t, 1]
                if y == 0:
                    num_slip += gamma[t, 1]
                # p_guess = P(y=correct | L=0)
                den_guess += gamma[t, 0]
                if y == 1:
                    num_guess += gamma[t, 0]

        # M-step with clipping (avoids degenerate 0/1 that traps later EM steps)
        if den_init > 0:
            p.p_init = float(np.clip(num_init / den_init, 0.01, 0.99))
        if den_learn > 0:
            p.p_learn = float(np.clip(num_learn / den_learn, 0.01, 0.50))
        if den_slip > 0:
            p.p_slip = float(np.clip(num_slip / den_slip, 0.01, 0.30))
        if den_guess > 0:
            p.p_guess = float(np.clip(num_guess / den_guess, 0.01, 0.40))

        # early stop if log-likelihood barely moves
        if abs(total_ll - last_ll) < 1e-4:
            break
        last_ll = total_ll

    return p, float(last_ll)


# ── One-step-ahead prediction (honest evaluation) ─────────────────────────


def predict_next_correct(seq: List[int], p: BktParams) -> List[float]:
    """For each position t (0-indexed), return P(y_t = correct) BEFORE seeing y_t.

    Result is the model's pre-observation prediction at each step. Use this
    against the actual y_t labels for honest one-step-ahead AUC.
    """
    T = len(seq)
    if T == 0:
        return []

    preds: List[float] = []
    # at t=0: predict before any data → use prior
    p_L1_pre = p.p_init
    preds.append(p_L1_pre * (1.0 - p.p_slip) + (1.0 - p_L1_pre) * p.p_guess)

    # running posterior over L after seeing y_0..y_t-1
    L0 = 1.0 - p.p_init
    L1 = p.p_init
    for t in range(T - 1):
        # incorporate y_t into posterior
        e0, e1 = _emission(seq[t], p)
        post0 = L0 * e0
        post1 = L1 * e1
        s = post0 + post1 + 1e-12
        post0 /= s
        post1 /= s
        # transition to t+1
        L0 = post0 * (1.0 - p.p_learn)
        L1 = post0 * p.p_learn + post1 * 1.0
        # prediction for y_{t+1}
        preds.append(L1 * (1.0 - p.p_slip) + L0 * p.p_guess)

    return preds
