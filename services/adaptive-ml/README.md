# mindflow-adaptive-ml

Adaptive learning models for MindFlow: classic **BKT baseline** (here) → **DKT** (next sprint).

> This subfolder is the local skeleton; once GitHub becomes reachable again it
> will be promoted into a separate public repository `EkaterinaGrisha/mindflow-adaptive-ml`
> via `git subtree push` (no rewrite of MindFlow main repo history).

## Why this exists

In production MindFlow uses Bayesian Knowledge Tracing (BKT) for per-concept
mastery (`update_bkt_mastery` PostgreSQL function, journal `bkt_attempts`,
aggregate `kg_mastery`). The default per-concept params (`p_init / p_learn /
p_slip / p_guess`) are a conservative educational baseline; once enough real
attempts accumulate they will be re-fit by an **EM-calibration** run from this
package and pushed back into `bkt_concept_params`.

This baseline establishes the floor against which DKT (deep knowledge tracing,
LSTM) will be benchmarked next sprint.

## Quickstart

```bash
cd services/adaptive-ml
python3 -m pip install -r requirements.txt   # numpy + scikit-learn
python3 run_baseline.py                      # train + evaluate
cat results/bkt_baseline.json                # AUC, ACC, RMSE
```

Reproducible: fixed seed `42` → AUC stable to ±0.005 across runs.

## What `run_baseline.py` does

1. **Generate synthetic data** — 500 students × 24 concepts × ~30 attempts.
   True params per concept are sampled around realistic priors with noise:
   `p_init ~ U(0.20, 0.40)`, `p_learn ~ U(0.10, 0.25)`,
   `p_slip ~ U(0.05, 0.15)`, `p_guess ~ U(0.15, 0.25)`.
   Latent state `L_t ∈ {0, 1}` evolves; observations `y_t` are sampled per BKT.
2. **Split** — 80% students for train, 20% hold-out (split is by student-id,
   never by time within a sequence).
3. **EM-fit per concept** — 30 EM iterations of forward-backward; M-step
   updates `p_init / p_learn / p_slip / p_guess` from posterior expectations.
4. **Predict on hold-out** — forward-only `P(y_{t+1} = correct | y_{1..t})`
   *before* seeing `y_{t+1}`. Honest one-step-ahead.
5. **Metrics** — AUC, accuracy at 0.5 threshold, RMSE. Persisted into
   `results/bkt_baseline.json` for the diploma report.

Expected on synthetic: **AUC ≈ 0.71–0.75**. (Real `bkt_attempts` from prod will
be plugged into the same pipeline once accumulated; for now synthetic seeds
the baseline number.)

## Done in this sprint

- ✓ **BKT baseline** — `bkt.py` + `run_baseline.py`. AUC 0.7694 on synthetic.
- ✓ **DKT baseline** — `dkt.py` + `run_dkt.py`. Piech-style LSTM, AUC 0.7240.
- ✓ **Recommender baseline** — `recommender.py` + `run_recommender.py`.
  5 strategies (Random / Most-frequent / Sticky / DKT-ZPD / DKT-uncertainty),
  Hit@K on hold-out. Honest split between behavioral and pedagogical recommenders.

## Next steps

1. **Real telemetry plug-in** — once `bkt_attempts` has ≥ 1k real attempts:
   pipe `supabase_export.py` → re-fit BKT per-concept params (EM) → push back
   to `bkt_concept_params`; re-train DKT and recommender on real cross-concept
   sequences (where DKT's advantage actually materializes).
2. **FastAPI service** — `/predict_mastery` + `/recommend_next`, served from
   this package and called by `apps/api` via `ADAPTIVE_ML_URL` (HTTP client
   already planned in `apps/api/src/llm/adaptiveMl.ts`).
3. **Better pedagogical metric** — Hit@K is a behavioral metric; for the
   pedagogical recommender we need learning-gain and mastery-progression
   evaluators (offline replay or online A/B).

## Layout

```
services/adaptive-ml/
├── README.md                  ← this file
├── pyproject.toml             ← package metadata
├── requirements.txt           ← numpy + scikit-learn
├── bkt.py                     ← synthetic data generator + BKT forward / EM
├── run_baseline.py            ← entry-point: train + eval + write JSON
├── tests/
│   └── test_bkt.py            ← sanity check on a tiny sequence
└── results/
    └── bkt_baseline.json      ← produced by run_baseline.py
```
