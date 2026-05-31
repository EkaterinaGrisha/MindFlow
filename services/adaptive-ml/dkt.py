"""Piech-style Deep Knowledge Tracing (DKT).

Architecture
------------
For each student we get a chronological sequence of (concept_idx, correct)
attempts.  Each attempt is encoded as a single integer ``2 * concept_idx + correct``
in {0, ..., 2K-1} and fed through an Embedding → LSTM → Linear(K) head with
sigmoid output: at step t the model predicts P(correct) for every concept at
step t+1, but the loss is computed only on the concept actually observed at
t+1.

Why a single Embedding instead of a 2K one-hot input
----------------------------------------------------
Same expressivity, ≈ 10x less memory at K=24, T≈720.  No accuracy difference
on this synthetic in informal sweeps.

Why one-step-ahead is honest
----------------------------
At time t the model has only seen y_0..y_t.  Predicting y_{t+1} given the
LSTM state at t is the same protocol BKT's ``predict_next_correct`` uses, so
the AUC numbers are directly comparable.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import numpy as np
import torch
from torch import nn
from torch.nn.utils.rnn import pack_padded_sequence, pad_packed_sequence


# ── Model ─────────────────────────────────────────────────────────────────


class DKTModel(nn.Module):
    def __init__(
        self,
        n_concepts: int,
        embed_dim: int = 50,
        hidden_dim: int = 64,
        dropout: float = 0.2,
    ) -> None:
        super().__init__()
        self.n_concepts = n_concepts
        # vocab size = 2 * n_concepts (one slot per (concept, correct) combo)
        self.embed = nn.Embedding(2 * n_concepts, embed_dim)
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True,
            dropout=0.0,  # single-layer LSTM ignores dropout anyway
        )
        self.drop = nn.Dropout(dropout)
        self.head = nn.Linear(hidden_dim, n_concepts)

    def forward(
        self,
        x_idx: torch.Tensor,    # (B, T)  long
        lengths: torch.Tensor,  # (B,)    long
    ) -> torch.Tensor:
        """Return logits of shape (B, T, K).

        At position t the logits predict the probability of *correct* for every
        concept *as if* the next attempt were on that concept.
        """
        emb = self.embed(x_idx)  # (B, T, E)
        # length-aware LSTM
        packed = pack_padded_sequence(emb, lengths.cpu(), batch_first=True, enforce_sorted=False)
        out_packed, _ = self.lstm(packed)
        out, _ = pad_packed_sequence(out_packed, batch_first=True, total_length=x_idx.size(1))
        out = self.drop(out)
        logits = self.head(out)  # (B, T, K)
        return logits


# ── Dataset construction ─────────────────────────────────────────────────


@dataclass
class StudentTrace:
    concept_idx: np.ndarray  # (T,) int  — what concept the attempt was on
    correct: np.ndarray      # (T,) int  — 0/1
    length: int

    @classmethod
    def from_per_concept(
        cls,
        per_concept_seqs: List[List[int]],
        rng: np.random.Generator,
        stickiness: float = 0.7,
    ) -> "StudentTrace":
        """Flatten per-concept sequences into one chronological per-student trace.

        Real students don't randomly hop between topics — they tend to stay on
        the current concept for a streak, then switch. We model this with a
        ``stickiness`` parameter: at each step, with probability ``stickiness``
        we continue on the most-recent concept (if it still has attempts left);
        otherwise we sample a concept weighted by its remaining attempts. The
        per-concept order of correct/incorrect is preserved exactly.

        stickiness=0.0 reproduces the old uniform-random interleave (useful as
        a sanity check that recommender Hit@K collapses to K / n_concepts).
        """
        n_concepts = len(per_concept_seqs)
        cursors = [0] * n_concepts
        lengths = [len(s) for s in per_concept_seqs]
        total = sum(lengths)
        concepts_out: List[int] = []
        correct_out: List[int] = []
        last_c: int | None = None

        for _ in range(total):
            avail = [c for c in range(n_concepts) if cursors[c] < lengths[c]]
            if not avail:
                break
            if last_c is not None and last_c in avail and rng.random() < stickiness:
                c = last_c
            else:
                # sample non-current concept weighted by remaining attempts —
                # avoids degenerate "same concept forever" when stickiness fails.
                pool = [c for c in avail if c != last_c] or avail
                weights = np.array([lengths[c] - cursors[c] for c in pool], dtype=float)
                weights /= weights.sum()
                c = int(rng.choice(pool, p=weights))
            concepts_out.append(c)
            correct_out.append(per_concept_seqs[c][cursors[c]])
            cursors[c] += 1
            last_c = c

        return cls(
            concept_idx=np.array(concepts_out, dtype=np.int64),
            correct=np.array(correct_out, dtype=np.int64),
            length=len(concepts_out),
        )


def make_input_indices(trace: StudentTrace, n_concepts: int) -> np.ndarray:
    """Encode each (concept, correct) pair into a single integer in [0, 2K)."""
    return 2 * trace.concept_idx + trace.correct


def collate_traces(
    traces: List[StudentTrace],
    n_concepts: int,
    device: torch.device,
) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
    """Build a padded batch.

    Returns
    -------
    x_idx   : (B, T_max) long — encoded input ids
    lengths : (B,) long
    next_concept : (B, T_max) long — concept observed at the *next* step
                   (padded with 0; positions past length-1 are masked out)
    next_correct : (B, T_max) float — 0/1 label for the next step
                   (positions past length-1 are masked out)

    By construction, position t carries the supervision for predicting step t+1.
    The last position (t = length-1) has no successor → it is masked.
    """
    max_t = max(tr.length for tr in traces)
    B = len(traces)
    x = np.zeros((B, max_t), dtype=np.int64)
    lengths = np.zeros((B,), dtype=np.int64)
    next_c = np.zeros((B, max_t), dtype=np.int64)
    next_y = np.zeros((B, max_t), dtype=np.float32)

    for b, tr in enumerate(traces):
        L = tr.length
        ids = make_input_indices(tr, n_concepts)
        x[b, :L] = ids
        lengths[b] = L
        # supervision shifted by one: target at t is what happens at t+1
        if L > 1:
            next_c[b, : L - 1] = tr.concept_idx[1:L]
            next_y[b, : L - 1] = tr.correct[1:L].astype(np.float32)

    return (
        torch.from_numpy(x).to(device),
        torch.from_numpy(lengths).to(device),
        torch.from_numpy(next_c).to(device),
        torch.from_numpy(next_y).to(device),
    )


# ── Training / evaluation ────────────────────────────────────────────────


def _supervision_mask(lengths: torch.Tensor, max_t: int) -> torch.Tensor:
    """1 for positions 0..L-2 (each has a next step), 0 elsewhere."""
    idx = torch.arange(max_t, device=lengths.device).unsqueeze(0)  # (1, T)
    mask = (idx < (lengths - 1).unsqueeze(1)).float()              # (B, T)
    return mask


def train_dkt(
    train_traces: List[StudentTrace],
    n_concepts: int,
    *,
    device: torch.device,
    embed_dim: int = 50,
    hidden_dim: int = 64,
    dropout: float = 0.2,
    epochs: int = 30,
    batch_size: int = 32,
    lr: float = 1e-3,
    seed: int = 42,
    val_traces: List[StudentTrace] | None = None,
    verbose: bool = True,
) -> Tuple[DKTModel, List[float]]:
    torch.manual_seed(seed)
    np.random.seed(seed)

    model = DKTModel(n_concepts, embed_dim, hidden_dim, dropout).to(device)
    optim = torch.optim.Adam(model.parameters(), lr=lr)
    loss_fn = nn.BCEWithLogitsLoss(reduction="none")

    rng = np.random.default_rng(seed)
    losses: List[float] = []

    for epoch in range(epochs):
        model.train()
        order = rng.permutation(len(train_traces))
        epoch_loss = 0.0
        n_batches = 0
        for i in range(0, len(order), batch_size):
            batch_ids = order[i : i + batch_size]
            batch = [train_traces[j] for j in batch_ids]
            x, lengths, next_c, next_y = collate_traces(batch, n_concepts, device)

            logits = model(x, lengths)                # (B, T, K)
            # gather logit for the actually observed next concept at each step
            next_c_unsq = next_c.unsqueeze(-1)        # (B, T, 1)
            logit_at_target = logits.gather(2, next_c_unsq).squeeze(-1)  # (B, T)
            raw = loss_fn(logit_at_target, next_y)    # (B, T)
            mask = _supervision_mask(lengths, x.size(1))
            loss = (raw * mask).sum() / mask.sum().clamp_min(1.0)

            optim.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            optim.step()

            epoch_loss += float(loss.item())
            n_batches += 1

        avg = epoch_loss / max(n_batches, 1)
        losses.append(avg)
        if verbose and (epoch + 1) % 5 == 0:
            val_msg = ""
            if val_traces is not None:
                auc, _acc, _rmse = evaluate_dkt(model, val_traces, n_concepts, device=device)
                val_msg = f" · val_AUC={auc:.4f}"
                model.train()
            print(f"[DKT] epoch {epoch + 1:2d}/{epochs} · loss={avg:.4f}{val_msg}")

    return model, losses


@torch.no_grad()
def evaluate_dkt(
    model: DKTModel,
    traces: List[StudentTrace],
    n_concepts: int,
    *,
    device: torch.device,
    batch_size: int = 64,
) -> Tuple[float, float, float]:
    from sklearn.metrics import accuracy_score, mean_squared_error, roc_auc_score

    model.eval()
    y_true: List[float] = []
    y_pred: List[float] = []
    for i in range(0, len(traces), batch_size):
        batch = traces[i : i + batch_size]
        x, lengths, next_c, next_y = collate_traces(batch, n_concepts, device)
        logits = model(x, lengths)
        probs = torch.sigmoid(logits.gather(2, next_c.unsqueeze(-1)).squeeze(-1))
        mask = _supervision_mask(lengths, x.size(1))

        m = mask.bool().cpu().numpy()
        y_true.append(next_y.cpu().numpy()[m])
        y_pred.append(probs.cpu().numpy()[m])

    y_true_arr = np.concatenate(y_true)
    y_pred_arr = np.concatenate(y_pred)

    auc = float(roc_auc_score(y_true_arr, y_pred_arr))
    acc = float(accuracy_score(y_true_arr, (y_pred_arr > 0.5).astype(int)))
    rmse = float(np.sqrt(mean_squared_error(y_true_arr, y_pred_arr)))
    return auc, acc, rmse


def pick_device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")
