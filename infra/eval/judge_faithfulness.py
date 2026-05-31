#!/usr/bin/env python3
"""LLM-as-judge faithfulness evaluation for MindFlow mentor benchmark.

Reads `report/data/mentor_benchmark*.json` (produced by
`tests/llm/mentor_benchmark.py --debug-chunks`) and, for each per-question
result, asks a judge LLM to label every atomic claim in the answer as
SUPPORTED / UNSUPPORTED / CONTRADICTED relative to the retrieved chunks.

Judge contract:
  - OpenAI-compatible chat completions endpoint (LM Studio, OpenRouter,
    DeepSeek, vLLM, …) selected via --base-url / --api-key / --model.
  - The judge is fixed (recommended: Qwen2.5-7B-Instruct in LM Studio).
    Keeping the judge constant across mentor models eliminates
    judge-variance from the comparison.

Inputs (the mentor benchmark JSON):
  {"per_question": [
     {"id", "question", "response", "retrieved_chunks": [{chunk_id,
      source_title, text, ...}], ...},
     ...
  ]}
  `retrieved_chunks[*].text` must be populated — run the benchmark with
  --debug-chunks (and the API must honour MENTOR_DEBUG_CHUNKS=1 or
  ?debug=1) for that to be true.

Output:
  {"aggregated": {
     "n_judged": int,
     "mean_faithfulness": float,
     "unsupported_rate": float,
     "contradicted_rate": float,
     "by_role": {ROLE: {...}}
   },
   "per_question": [
     {"id", "role", "faithfulness", "claims": [...], "raw_judge": "..."},
     ...
   ]}
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

try:
    from openai import OpenAI
except ImportError:
    print("ERROR: 'openai' package not found. Run: pip3 install openai")
    sys.exit(1)


JUDGE_SYSTEM_PROMPT = (
    "Ты строгий фактчекер. На входе — вопрос студента, ответ AI-ментора и "
    "извлечённые из учебного корпуса источники, на которых ментор должен "
    "был основываться.\n\n"
    "Твоя задача: разложи ответ ментора на атомарные фактические утверждения "
    "(определения, формулы, конкретные числа, причинно-следственные связи). "
    "Игнорируй риторику, поощрения, сократические вопросы и педагогические "
    "приёмы — это не утверждения о фактах.\n\n"
    "Для каждого атомарного утверждения присвой одну метку:\n"
    "  SUPPORTED — утверждение явно подкреплено каким-то из источников.\n"
    "  UNSUPPORTED — утверждение в источниках не подтверждается, но и не "
    "противоречит им (модель додумала).\n"
    "  CONTRADICTED — утверждение прямо противоречит хотя бы одному "
    "источнику.\n\n"
    "Верни ТОЛЬКО валидный JSON по схеме:\n"
    '{"claims": [{"text": "<утверждение>", "label": '
    '"SUPPORTED|UNSUPPORTED|CONTRADICTED", "evidence_chunk_id": "<id или null>"}],\n'
    ' "faithfulness": <float 0.0..1.0>}\n\n'
    "faithfulness = доля SUPPORTED среди всех claims (0.0, если claims пуст).\n"
    "Никакого текста до или после JSON."
)


def _build_judge_user_prompt(question: str, answer: str, chunks: list[dict]) -> str:
    """Compose the user-side prompt: question + answer + concatenated sources."""
    if not chunks:
        sources_block = "(источников не извлечено)"
    else:
        parts = []
        for i, c in enumerate(chunks, 1):
            text = (c.get("text") or "").strip()
            if not text:
                continue
            title = c.get("source_title") or c.get("chunk_id") or f"chunk_{i}"
            cid = c.get("chunk_id") or f"chunk_{i}"
            parts.append(f"[{cid}] {title}\n{text}")
        sources_block = "\n\n---\n\n".join(parts) if parts else "(источники без текста — debug-флаг не выставлен)"

    return (
        f"### Вопрос студента\n{question}\n\n"
        f"### Ответ ментора\n{answer}\n\n"
        f"### Извлечённые источники\n{sources_block}\n\n"
        "Оцени ответ ментора по схеме из system-промпта. Верни только JSON."
    )


# The judge sometimes wraps JSON in ```json ... ``` fences or trailing
# narration despite the instruction. We strip fences and pull the largest
# {...} block as a fallback before giving up.
_FENCE_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)
_JSON_OBJ_RE = re.compile(r"\{[\s\S]*\}")

# LM Studio enforces this schema via grammar-based constrained decoding (GBNF),
# so the judge physically cannot emit invalid JSON or out-of-enum labels —
# even when claims contain LaTeX with backslashes (\times, \beta) that would
# otherwise break naive json.loads. Applies to any model loaded into LM Studio,
# regardless of its JSON-mode training.
_JUDGE_RESPONSE_FORMAT = {
    "type": "json_schema",
    "json_schema": {
        "name": "faithfulness_judgement",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "claims": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "text": {"type": "string"},
                            "label": {
                                "type": "string",
                                "enum": ["SUPPORTED", "UNSUPPORTED", "CONTRADICTED"],
                            },
                            "evidence_chunk_id": {"type": ["string", "null"]},
                        },
                        "required": ["text", "label", "evidence_chunk_id"],
                        "additionalProperties": False,
                    },
                },
                "faithfulness": {"type": "number", "minimum": 0.0, "maximum": 1.0},
            },
            "required": ["claims", "faithfulness"],
            "additionalProperties": False,
        },
    },
}


def parse_judge_output(raw: str) -> dict | None:
    """Try hard to recover a JSON object from a noisy judge response."""
    if not raw:
        return None

    # First try the whole thing as JSON
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Then look inside ``` fences
    fence = _FENCE_RE.search(raw)
    if fence:
        try:
            return json.loads(fence.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Finally grab the biggest {...} block
    obj = _JSON_OBJ_RE.search(raw)
    if obj:
        try:
            return json.loads(obj.group(0))
        except json.JSONDecodeError:
            return None

    return None


def _resolve_response_format(mode: str):
    if mode == "json_schema":
        return _JUDGE_RESPONSE_FORMAT
    if mode == "json_object":
        return {"type": "json_object"}
    return None  # "none" — без response_format


def call_judge(
    client: OpenAI,
    model: str,
    question: str,
    answer: str,
    chunks: list[dict],
    temperature: float = 0.0,
    retries: int = 2,
    response_format_mode: str = "json_schema",
) -> tuple[dict | None, str]:
    """Return (parsed_dict_or_None, raw_text). raw_text is always set for debug.

    response_format_mode:
      "json_schema" — LM Studio (grammar-constrained, default)
      "json_object" — DeepSeek / OpenAI (basic JSON mode)
      "none"       — fallback: text + regex extraction
    """
    user_prompt = _build_judge_user_prompt(question, answer, chunks)
    last_raw = ""
    rf = _resolve_response_format(response_format_mode)
    kwargs = {"response_format": rf} if rf is not None else {}
    for attempt in range(retries + 1):
        try:
            resp = client.chat.completions.create(
                model=model,
                temperature=temperature,
                # 2000 хватает для LM Studio (no reasoning), но DeepSeek V4 —
                # reasoning model, и ≈1500 токенов уходят на скрытый thinking.
                # 8000 даёт запас и для reasoning, и для финального JSON.
                max_tokens=8000,
                messages=[
                    {"role": "system", "content": JUDGE_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                **kwargs,
            )
            last_raw = (resp.choices[0].message.content or "").strip()
            parsed = parse_judge_output(last_raw)
            if parsed is not None:
                return parsed, last_raw
        except Exception as e:
            last_raw = f"<judge-call-error attempt={attempt}>: {e}"
        if attempt < retries:
            time.sleep(2 ** attempt)
    return None, last_raw


def _normalize_label(label: str) -> str:
    L = (label or "").strip().upper()
    if L in ("SUPPORTED", "UNSUPPORTED", "CONTRADICTED"):
        return L
    # Common drift from JSON-weak models
    if L.startswith("SUP"):
        return "SUPPORTED"
    if L.startswith("UNS"):
        return "UNSUPPORTED"
    if L.startswith("CON"):
        return "CONTRADICTED"
    return "UNSUPPORTED"  # safest default for unknown labels


def _compute_faithfulness(claims: list[dict]) -> float:
    if not claims:
        return 0.0
    sup = sum(1 for c in claims if _normalize_label(c.get("label", "")) == "SUPPORTED")
    return sup / len(claims)


def main() -> None:
    parser = argparse.ArgumentParser(description="MindFlow faithfulness judge (LLM-as-judge)")
    parser.add_argument(
        "--input",
        default="report/data/mentor_benchmark_v2.json",
        help="Mentor benchmark JSON (with retrieved_chunks[*].text populated)",
    )
    parser.add_argument(
        "--output",
        default="report/data/faithfulness_v2.json",
        help="Where to write the judge results",
    )
    parser.add_argument(
        "--base-url",
        default=os.environ.get("JUDGE_BASE_URL", "http://localhost:1234/v1"),
        help="OpenAI-compatible base URL (LM Studio default: http://localhost:1234/v1)",
    )
    parser.add_argument(
        "--api-key",
        default=os.environ.get("JUDGE_API_KEY", "lm-studio"),
        help="API key for the judge endpoint (LM Studio ignores it but the SDK requires a value)",
    )
    parser.add_argument(
        "--model",
        default=os.environ.get("JUDGE_MODEL", "qwen2.5-7b-instruct"),
        help="Judge model identifier (recommended: qwen2.5-7b-instruct)",
    )
    parser.add_argument("--delay", type=float, default=0.5, help="Delay between judge calls (s)")
    parser.add_argument("--limit", type=int, default=0, help="Judge only the first N questions (0 = all)")
    parser.add_argument(
        "--response-format",
        choices=["json_schema", "json_object", "none"],
        default=os.environ.get("JUDGE_RESPONSE_FORMAT", "json_schema"),
        help="json_schema=LM Studio (default), json_object=DeepSeek/OpenAI, none=text+regex fallback",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).parent.parent.parent
    input_path = (repo_root / args.input).resolve()
    output_path = (repo_root / args.output).resolve()

    if not input_path.exists():
        print(f"ERROR: input not found: {input_path}")
        sys.exit(1)

    with open(input_path, encoding="utf-8") as f:
        bench = json.load(f)

    per_question = bench.get("per_question") or []
    if args.limit > 0:
        per_question = per_question[: args.limit]

    if not per_question:
        print(f"ERROR: no per_question entries in {input_path}")
        sys.exit(1)

    # Warn if retrieved_chunks lack text — judge will be flying blind.
    n_with_text = sum(
        1
        for r in per_question
        if any((c.get("text") or "").strip() for c in (r.get("retrieved_chunks") or []))
    )
    if n_with_text == 0:
        print(
            "WARNING: no retrieved_chunks[*].text found in any result.\n"
            "         Re-run the benchmark with --debug-chunks (and ensure the API\n"
            "         honours MENTOR_DEBUG_CHUNKS=1 or ?debug=1). Continuing anyway."
        )
    elif n_with_text < len(per_question):
        print(f"NOTE: {n_with_text}/{len(per_question)} questions have chunk text.")

    client = OpenAI(base_url=args.base_url, api_key=args.api_key, timeout=120.0)

    print(f"\nMindFlow Faithfulness Judge")
    print(f"Input:   {input_path}")
    print(f"Output:  {output_path}")
    print(f"Judge:   {args.model} @ {args.base_url}")
    print(f"N:       {len(per_question)}")
    print("─" * 72)

    judged: list[dict] = []
    by_role: dict[str, list[dict]] = {}

    for i, r in enumerate(per_question, 1):
        qid = r.get("id", f"q{i}")
        role = r.get("role", "UNKNOWN")
        question = r.get("question", "")
        answer = r.get("response", "")
        chunks = r.get("retrieved_chunks") or []

        if r.get("error") or not answer:
            print(f"  [{i:02d}/{len(per_question)}] {qid} ({role}) — skipped (error/empty)")
            entry = {
                "id": qid,
                "role": role,
                "faithfulness": 0.0,
                "claims": [],
                "n_supported": 0,
                "n_unsupported": 0,
                "n_contradicted": 0,
                "skipped": True,
                "raw_judge": "",
            }
            judged.append(entry)
            by_role.setdefault(role, []).append(entry)
            continue

        print(f"  [{i:02d}/{len(per_question)}] {qid} ({role}) — judging…", end=" ", flush=True)
        _t0 = time.perf_counter()
        parsed, raw = call_judge(
            client, args.model, question, answer, chunks,
            response_format_mode=args.response_format,
        )
        elapsed = time.perf_counter() - _t0

        if parsed is None:
            print(f"PARSE-FAIL ({elapsed:.1f}s)", flush=True)
            entry = {
                "id": qid,
                "role": role,
                "faithfulness": 0.0,
                "claims": [],
                "n_supported": 0,
                "n_unsupported": 0,
                "n_contradicted": 0,
                "skipped": False,
                "parse_failed": True,
                "raw_judge": raw[:2000],
            }
        else:
            raw_claims = parsed.get("claims") or []
            claims = [
                {
                    "text": (c.get("text") or "")[:500],
                    "label": _normalize_label(c.get("label", "")),
                    "evidence_chunk_id": c.get("evidence_chunk_id"),
                }
                for c in raw_claims
                if isinstance(c, dict)
            ]
            # Prefer judge-reported faithfulness if it parses as a float, else recompute.
            try:
                f = float(parsed.get("faithfulness"))
                if not (0.0 <= f <= 1.0):
                    raise ValueError
            except (TypeError, ValueError):
                f = _compute_faithfulness(claims)

            n_sup = sum(1 for c in claims if c["label"] == "SUPPORTED")
            n_uns = sum(1 for c in claims if c["label"] == "UNSUPPORTED")
            n_con = sum(1 for c in claims if c["label"] == "CONTRADICTED")
            print(f"f={f:.2f} sup={n_sup} uns={n_uns} con={n_con} ({elapsed:.1f}s)", flush=True)
            entry = {
                "id": qid,
                "role": role,
                "faithfulness": f,
                "claims": claims,
                "n_supported": n_sup,
                "n_unsupported": n_uns,
                "n_contradicted": n_con,
                "skipped": False,
                "parse_failed": False,
                "raw_judge": "",  # kept empty for size; --debug-judge could re-enable
            }

        judged.append(entry)
        by_role.setdefault(role, []).append(entry)

        # Incremental checkpoint: dump partial results after every question so a
        # crash/kill mid-run doesn't lose hours of judge work. Final iteration
        # overwrites with the proper aggregated block below.
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f_out:
            json.dump(
                {"aggregated": {"in_progress": True, "n_done": i, "n_total": len(per_question)},
                 "per_question": judged},
                f_out, ensure_ascii=False, indent=2,
            )

        if args.delay > 0:
            time.sleep(args.delay)

    # ── Aggregation ───────────────────────────────────────────────────────────
    real = [r for r in judged if not r.get("skipped") and not r.get("parse_failed")]
    n_judged = len(real)
    total_claims = sum(len(r["claims"]) for r in real)
    total_sup = sum(r["n_supported"] for r in real)
    total_uns = sum(r["n_unsupported"] for r in real)
    total_con = sum(r["n_contradicted"] for r in real)

    aggregated: dict[str, Any] = {
        "n_input": len(per_question),
        "n_judged": n_judged,
        "n_parse_failed": sum(1 for r in judged if r.get("parse_failed")),
        "n_skipped": sum(1 for r in judged if r.get("skipped")),
        "mean_faithfulness": (
            sum(r["faithfulness"] for r in real) / n_judged if n_judged else 0.0
        ),
        "total_claims": total_claims,
        "supported_rate": total_sup / total_claims if total_claims else 0.0,
        "unsupported_rate": total_uns / total_claims if total_claims else 0.0,
        "contradicted_rate": total_con / total_claims if total_claims else 0.0,
        "judge_model": args.model,
        "judge_base_url": args.base_url,
        "by_role": {},
    }

    for role, rs in by_role.items():
        rs_real = [r for r in rs if not r.get("skipped") and not r.get("parse_failed")]
        rs_claims = sum(len(r["claims"]) for r in rs_real)
        aggregated["by_role"][role] = {
            "n": len(rs),
            "n_judged": len(rs_real),
            "mean_faithfulness": (
                sum(r["faithfulness"] for r in rs_real) / len(rs_real) if rs_real else 0.0
            ),
            "supported_rate": (
                sum(r["n_supported"] for r in rs_real) / rs_claims if rs_claims else 0.0
            ),
            "unsupported_rate": (
                sum(r["n_unsupported"] for r in rs_real) / rs_claims if rs_claims else 0.0
            ),
            "contradicted_rate": (
                sum(r["n_contradicted"] for r in rs_real) / rs_claims if rs_claims else 0.0
            ),
        }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(
            {"aggregated": aggregated, "per_question": judged},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print("─" * 72)
    print(
        f"mean_faithfulness = {aggregated['mean_faithfulness']:.3f}, "
        f"unsupported = {aggregated['unsupported_rate']:.1%}, "
        f"contradicted = {aggregated['contradicted_rate']:.1%}, "
        f"parse_failed = {aggregated['n_parse_failed']}/{len(judged)}"
    )
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    main()
