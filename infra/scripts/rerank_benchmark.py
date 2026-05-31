"""
rerank_benchmark.py

Reranker A/B benchmark on the MindFlow RAG corpus.

Fix the embedder to the production-winning Qwen3-Embedding-0.6B (Python ST,
CPU — same setup as embed_benchmark.py). Then, for each query in the golden
set, fetch top-K candidates via dense cosine, run each reranker over those
candidates, and recompute retrieval metrics from the post-rerank order.

Stages (cached separately, resumable):
    1. candidates — embed corpus + queries with Qwen3, save top-K candidates
                    per query (cached in benchmark_data/candidates.json).
                    This is the most expensive step (~20 min on CPU).
    2. rerankers  — for each reranker model, score all (query, doc) pairs,
                    re-sort, recompute R@K / MRR / NDCG. Results per-model
                    in benchmark_data/results/<key>_rerank.json.
    3. report     — render reports/reranker-benchmark.md.

Run:
    python3 infra/scripts/rerank_benchmark.py --stage all
    python3 infra/scripts/rerank_benchmark.py --stage rerankers --only bge-rrk
"""

from __future__ import annotations

# Disable TF/JAX autodetection in transformers (same issue as embed_benchmark).
import os as _os
_os.environ.setdefault("USE_TF", "0")
_os.environ.setdefault("USE_FLAX", "0")
_os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "1")
_os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
_os.environ.setdefault("HF_HUB_DISABLE_XET", "1")

import argparse
import gc
import json
import math
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(__file__).resolve().parent / "benchmark_data"
DATA_DIR.mkdir(exist_ok=True)
RESULTS_DIR = DATA_DIR / "results"
RESULTS_DIR.mkdir(exist_ok=True)
REPORT_PATH = ROOT / "reports" / "reranker-benchmark.md"

CORPUS_PATH = DATA_DIR / "corpus.json"
GOLDEN_PATH = DATA_DIR / "golden_set.json"
CANDS_PATH = DATA_DIR / "candidates.json"

# Embedder used for first-stage retrieval (= what's running in prod after Qwen3 migration).
EMBED_MODEL = "Qwen/Qwen3-Embedding-0.6B"
EMBED_PREFIX_Q = "Instruct: Given a student's question about math, retrieve relevant explanations from a textbook.\nQuery: "
EMBED_PREFIX_P = ""

CANDIDATE_K = 20   # rerank top-K candidates per query
TOP_K = 10         # report metrics at K=10

# ─── Reranker registry ─────────────────────────────────────────────────────────

@dataclass
class RerankerSpec:
    key: str
    hf_id: str
    kind: str   # 'cross_encoder' | 'qwen3_chat' | 'jina_v2'
    notes: str
    trust_remote_code: bool = False

RERANKERS: list[RerankerSpec] = [
    RerankerSpec(
        "bge-rrk-v2-m3",
        "BAAI/bge-reranker-v2-m3",
        "cross_encoder",
        "Top multilingual reranker (568M).",
    ),
    RerankerSpec(
        "qwen3-rrk-0.6b",
        "Qwen/Qwen3-Reranker-0.6B",
        "qwen3_chat",
        "Qwen3 family reranker — chat-template style (yes/no logits).",
        trust_remote_code=True,
    ),
    RerankerSpec(
        "jina-rrk-v2-ml",
        "jinaai/jina-reranker-v2-base-multilingual",
        "cross_encoder",
        "Compact multilingual reranker (278M).",
        trust_remote_code=True,
    ),
]

# ─── Stage 1: candidates ──────────────────────────────────────────────────────

def stage_candidates() -> None:
    if not CORPUS_PATH.exists():
        sys.exit("[candidates] corpus.json missing — run embed_benchmark --stage corpus first")
    if not GOLDEN_PATH.exists():
        sys.exit("[candidates] golden_set.json missing — run embed_benchmark --stage goldenset first")
    if CANDS_PATH.exists():
        print(f"[candidates] {CANDS_PATH} already exists — delete to redo")
        return

    corpus: list[dict[str, Any]] = json.loads(CORPUS_PATH.read_text())
    golden: list[dict[str, Any]] = json.loads(GOLDEN_PATH.read_text())
    print(f"[candidates] corpus={len(corpus)} golden={len(golden)}")

    from sentence_transformers import SentenceTransformer
    print(f"[candidates] loading {EMBED_MODEL} (Python ST, CPU)...")
    t0 = time.perf_counter()
    model = SentenceTransformer(EMBED_MODEL, trust_remote_code=False, device="cpu")
    print(f"[candidates] loaded in {time.perf_counter()-t0:.1f}s")

    print(f"[candidates] embedding {len(corpus)} chunks...")
    t0 = time.perf_counter()
    doc_embs = model.encode(
        [EMBED_PREFIX_P + c["chunk_text"] for c in corpus],
        batch_size=16, show_progress_bar=True,
        normalize_embeddings=True, convert_to_numpy=True,
    )
    print(f"[candidates] corpus encoded in {time.perf_counter()-t0:.1f}s")

    q_embs = model.encode(
        [EMBED_PREFIX_Q + g["query"] for g in golden],
        batch_size=16, show_progress_bar=False,
        normalize_embeddings=True, convert_to_numpy=True,
    )

    sims = q_embs @ doc_embs.T
    top_idx = np.argsort(-sims, axis=1)[:, :CANDIDATE_K]

    out: list[dict[str, Any]] = []
    for qi, gold in enumerate(golden):
        cand_ids = [corpus[int(idx)]["id"] for idx in top_idx[qi]]
        cand_texts = [corpus[int(idx)]["chunk_text"] for idx in top_idx[qi]]
        cand_scores = [float(sims[qi, int(idx)]) for idx in top_idx[qi]]
        out.append({
            "query": gold["query"],
            "ground_truth_id": gold["ground_truth_id"],
            "candidate_ids": cand_ids,
            "candidate_texts": cand_texts,
            "candidate_scores": cand_scores,
        })

    CANDS_PATH.write_text(json.dumps(out, ensure_ascii=False))
    print(f"[candidates] saved → {CANDS_PATH}")

    del model, doc_embs, q_embs, sims
    gc.collect()


# ─── Reranker wrappers ────────────────────────────────────────────────────────

class Reranker(Protocol):
    def score(self, query: str, docs: list[str]) -> list[float]: ...


def load_cross_encoder(spec: RerankerSpec):
    from sentence_transformers import CrossEncoder
    print(f"[{spec.key}] loading {spec.hf_id} as CrossEncoder...")
    t0 = time.perf_counter()
    model = CrossEncoder(spec.hf_id, device="cpu", trust_remote_code=spec.trust_remote_code)
    print(f"[{spec.key}] loaded in {time.perf_counter()-t0:.1f}s")

    class _CE:
        def score(self, query: str, docs: list[str]) -> list[float]:
            pairs = [[query, d] for d in docs]
            scores = model.predict(pairs, show_progress_bar=False, convert_to_numpy=True)
            return [float(s) for s in scores]
    return _CE(), model


def load_qwen3_chat(spec: RerankerSpec):
    """
    Qwen3-Reranker uses an LLM scoring pattern:
        prompt = "<Instruct: ...><Query: ...><Document: ...>"
        score = P("yes" | prompt) / (P("yes") + P("no"))

    Implementation follows the official model card:
      https://huggingface.co/Qwen/Qwen3-Reranker-0.6B

    Device selection via env BENCH_DEVICE (cpu|mps|cuda). MPS is recommended
    on Apple M-series — for single-pair LLM inference it's ~5-10x faster than
    CPU (no memory pressure of batch encoding).
    """
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM

    device = _os.environ.get("BENCH_DEVICE")
    if not device:
        if torch.backends.mps.is_available() and torch.backends.mps.is_built():
            device = "mps"
        elif torch.cuda.is_available():
            device = "cuda"
        else:
            device = "cpu"

    print(f"[{spec.key}] loading {spec.hf_id} on device={device} ...")
    t0 = time.perf_counter()
    tok = AutoTokenizer.from_pretrained(spec.hf_id, padding_side="left", trust_remote_code=True)
    # MPS prefers fp16 for speed; CPU keeps fp32 for stability.
    torch_dtype = torch.float16 if device == "mps" else "auto"
    mdl = AutoModelForCausalLM.from_pretrained(
        spec.hf_id, torch_dtype=torch_dtype, trust_remote_code=True,
    ).eval()
    mdl.to(device)
    print(f"[{spec.key}] loaded in {time.perf_counter()-t0:.1f}s")

    # Standard prompt format from Qwen3-Reranker README.
    TASK = "Given a student's question about math, retrieve passages that answer the question."
    PREFIX = "<|im_start|>system\nJudge whether the Document meets the requirements based on the Query and the Instruct provided. Note that the answer can only be \"yes\" or \"no\".<|im_end|>\n<|im_start|>user\n"
    SUFFIX = "<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n"

    token_yes = tok("yes", add_special_tokens=False).input_ids[0]
    token_no = tok("no", add_special_tokens=False).input_ids[0]

    # On MPS, batching 20 prompts × ~2K tokens × 1024 hidden hits the
    # `NDArray dimension > INT_MAX` assertion. Score one-by-one — slower
    # per call, but no OOM, and the GPU is fast enough on short single forwards.
    MAX_LEN = 2048
    BATCH = 4 if device == "mps" else 8

    @torch.no_grad()
    def _score_batch(query: str, docs: list[str]) -> list[float]:
        all_scores: list[float] = []
        for off in range(0, len(docs), BATCH):
            chunk = docs[off:off + BATCH]
            prompts = [
                f"{PREFIX}<Instruct>: {TASK}\n<Query>: {query}\n<Document>: {d[:1500]}{SUFFIX}"
                for d in chunk
            ]
            enc = tok(prompts, padding=True, truncation=True, max_length=MAX_LEN, return_tensors="pt")
            enc = {k: v.to(device) for k, v in enc.items()}
            out = mdl(**enc).logits
            last = out[:, -1, :]
            pair = torch.stack([last[:, token_no], last[:, token_yes]], dim=-1)
            probs = torch.softmax(pair, dim=-1)
            all_scores.extend(probs[:, 1].cpu().tolist())
        return all_scores

    class _Q3:
        def score(self, query: str, docs: list[str]) -> list[float]:
            return _score_batch(query, docs)
    return _Q3(), mdl


def load_reranker(spec: RerankerSpec):
    if spec.kind == "cross_encoder":
        return load_cross_encoder(spec)
    if spec.kind == "qwen3_chat":
        return load_qwen3_chat(spec)
    raise ValueError(f"unknown kind: {spec.kind}")


# ─── Metrics ──────────────────────────────────────────────────────────────────

def metrics_from_ranks(ranks: list[int | None], k_values: list[int]) -> dict[str, float]:
    n = len(ranks)
    out: dict[str, float] = {}
    for k in k_values:
        hits = sum(1 for r in ranks if r is not None and r <= k)
        out[f"recall@{k}"] = hits / n
    mrr = [1.0 / r if r is not None and r <= 10 else 0.0 for r in ranks]
    out["mrr@10"] = float(np.mean(mrr))
    ndcg = [1.0 / math.log2(r + 1) if r is not None and r <= 10 else 0.0 for r in ranks]
    out["ndcg@10"] = float(np.mean(ndcg))
    return out


def baseline_ranks(candidates: list[dict[str, Any]]) -> list[int | None]:
    ranks: list[int | None] = []
    for c in candidates:
        gt = c["ground_truth_id"]
        try:
            pos = c["candidate_ids"].index(gt) + 1
            ranks.append(pos)
        except ValueError:
            ranks.append(None)
    return ranks


# ─── Stage 2: rerankers ───────────────────────────────────────────────────────

def stage_rerankers(only: list[str] | None) -> None:
    if not CANDS_PATH.exists():
        sys.exit("[rerankers] candidates.json missing — run --stage candidates first")
    candidates: list[dict[str, Any]] = json.loads(CANDS_PATH.read_text())
    print(f"[rerankers] {len(candidates)} queries, top-{CANDIDATE_K} candidates each")

    # Baseline (no reranker = Qwen3 dense order)
    b_ranks = baseline_ranks(candidates)
    b_metrics = metrics_from_ranks(b_ranks, k_values=[1, 3, 5, 10])
    baseline_out = {
        "model_key": "qwen3-dense-baseline",
        "hf_id": EMBED_MODEL,
        "kind": "embedder_only",
        "notes": "First-stage retrieval only (no reranker)",
        "metrics": b_metrics,
        "n_queries": len(candidates),
        "candidate_k": CANDIDATE_K,
        "ranks": b_ranks,
    }
    (RESULTS_DIR / "qwen3-dense-baseline_rerank.json").write_text(
        json.dumps(baseline_out, ensure_ascii=False, indent=2)
    )
    print(f"[rerankers] baseline {b_metrics}")

    for spec in RERANKERS:
        if only and spec.key not in only:
            continue
        out_path = RESULTS_DIR / f"{spec.key}_rerank.json"
        if out_path.exists() and not only:
            print(f"[rerankers] {spec.key} already done — skip (delete to redo)")
            continue
        try:
            reranker, _ = load_reranker(spec)
        except Exception as e:
            print(f"[rerankers] {spec.key} LOAD FAILED: {e}")
            import traceback; traceback.print_exc()
            continue

        ranks: list[int | None] = []
        latencies_ms: list[float] = []
        for i, c in enumerate(candidates):
            t0 = time.perf_counter()
            scores = reranker.score(c["query"], c["candidate_texts"])
            elapsed = (time.perf_counter() - t0) * 1000
            latencies_ms.append(elapsed)
            order = sorted(range(len(scores)), key=lambda j: -scores[j])
            reranked_ids = [c["candidate_ids"][j] for j in order]
            try:
                pos = reranked_ids.index(c["ground_truth_id"]) + 1
                ranks.append(pos)
            except ValueError:
                ranks.append(None)
            if (i + 1) % 10 == 0:
                rate = (i + 1) / sum(l for l in latencies_ms[:i+1]) * 1000
                print(f"[{spec.key}]   {i+1}/{len(candidates)}  median={np.median(latencies_ms):.0f}ms/q")

        m = metrics_from_ranks(ranks, k_values=[1, 3, 5, 10])
        result = {
            "model_key": spec.key,
            "hf_id": spec.hf_id,
            "kind": spec.kind,
            "notes": spec.notes,
            "metrics": m,
            "median_latency_ms": float(np.median(latencies_ms)),
            "n_queries": len(candidates),
            "candidate_k": CANDIDATE_K,
            "ranks": ranks,
        }
        out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2))
        print(f"[rerankers] {spec.key} {m} → {out_path}")

        # Free memory before next
        del reranker
        gc.collect()


# ─── Stage 3: report ──────────────────────────────────────────────────────────

def stage_report() -> None:
    results: list[dict[str, Any]] = []
    for p in sorted(RESULTS_DIR.glob("*_rerank.json")):
        results.append(json.loads(p.read_text()))
    if not results:
        sys.exit("[report] no rerank result files")
    results.sort(key=lambda r: -r["metrics"]["ndcg@10"])

    lines: list[str] = []
    lines.append("# Reranker A/B benchmark — MindFlow corpus")
    lines.append("")
    lines.append(
        f"Сравнение реранкеров поверх **Qwen3-Embedding-0.6B** (текущий продакшен-эмбеддер). "
        f"Каждый реранкер пересортировывает top-{CANDIDATE_K} кандидатов от dense-retrieval."
    )
    lines.append("")
    base = next((r for r in results if r["model_key"] == "qwen3-dense-baseline"), None)
    lines.append(f"- Golden set: 50 пар (query, ground-truth chunk) — тот же, что в embedding-бенчмарке")
    lines.append(f"- First-stage retrieval: Qwen3-Embedding-0.6B (Python ST, CPU)")
    lines.append(f"- Candidate pool: top-{CANDIDATE_K} от dense")
    lines.append(f"- Реранкеры скорят 20 пар (query, doc) и пересортировывают")
    lines.append("")
    lines.append("## Результаты")
    lines.append("")
    lines.append("| Модель | Тип | R@1 | R@5 | R@10 | MRR@10 | NDCG@10 | Latency, мс/q |")
    lines.append("|---|---|---:|---:|---:|---:|---:|---:|")
    for r in results:
        m = r["metrics"]
        latency = r.get("median_latency_ms", 0.0)
        latency_str = f"{latency:.0f}" if latency > 0 else "— (no reranker)"
        marker = "🏆 " if r is results[0] else ""
        baseline_marker = " *(baseline)*" if r["model_key"] == "qwen3-dense-baseline" else ""
        lines.append(
            f"| {marker}`{r['model_key']}`{baseline_marker} "
            f"| {r['kind']} "
            f"| {m['recall@1']:.2f} "
            f"| {m['recall@5']:.2f} "
            f"| {m['recall@10']:.2f} "
            f"| {m['mrr@10']:.3f} "
            f"| {m['ndcg@10']:.3f} "
            f"| {latency_str} |"
        )
    lines.append("")

    winner = results[0]
    if winner["model_key"] != "qwen3-dense-baseline" and base:
        delta_ndcg = winner["metrics"]["ndcg@10"] - base["metrics"]["ndcg@10"]
        delta_r5 = winner["metrics"]["recall@5"] - base["metrics"]["recall@5"]
        lines.append(f"## Победитель: `{winner['model_key']}`")
        lines.append("")
        lines.append(f"**Модель:** `{winner['hf_id']}`")
        lines.append("")
        lines.append(f"Прирост над baseline (Qwen3-dense без реранкера):")
        lines.append(f"- NDCG@10: **+{delta_ndcg:.3f}** ({delta_ndcg/max(base['metrics']['ndcg@10'],1e-6)*100:.1f}%)")
        lines.append(f"- Recall@5: **+{delta_r5:.3f}**")
        lines.append(f"- Latency cost: +{winner.get('median_latency_ms',0):.0f}мс/q на top-{CANDIDATE_K} reranking")
        lines.append("")
    elif base:
        lines.append(f"## Победитель: baseline (без реранкера)")
        lines.append("")
        lines.append("Ни один из протестированных реранкеров не улучшил Qwen3-dense на нашем корпусе.")
        lines.append("")

    lines.append("## Методика")
    lines.append("")
    lines.append("1. Берётся тот же golden set (50 пар), что в `reports/embedding-benchmark.md`.")
    lines.append(f"2. Qwen3-Embedding-0.6B (Python ST) индексирует корпус и выдаёт top-{CANDIDATE_K} для каждого запроса.")
    lines.append("3. Каждый реранкер скорит 20 пар (query, doc), результат пересортировывается.")
    lines.append("4. Метрики считаются на новой позиции ground_truth_chunk в пересортированном топе.")
    lines.append("")
    lines.append("Воспроизведение: `python3 infra/scripts/rerank_benchmark.py --stage all`")
    lines.append("")

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines))
    print(f"[report] wrote {REPORT_PATH}")


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", required=True,
                    choices=["all", "candidates", "rerankers", "report"])
    ap.add_argument("--only", nargs="*", help="restrict --stage rerankers to these keys")
    args = ap.parse_args()
    if args.stage in ("all", "candidates"):
        stage_candidates()
    if args.stage in ("all", "rerankers"):
        stage_rerankers(only=args.only)
    if args.stage in ("all", "report"):
        stage_report()


if __name__ == "__main__":
    main()
