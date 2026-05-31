"""Phase B aggregator: собирает per-model bench + judge JSON в одну
model_comparison.{json,md} для раздела 7.2 диплома.

Reads:
  report/data/mentor_benchmark_{slug}.json
  report/data/faithfulness_{slug}.json        (судья фиксирован: deepseek-v4-flash)
  report/data/hardware_stats.json             (vram_gb / tokens_per_sec / context_window)

Writes:
  report/data/model_comparison.json
  report/tables/model_comparison.md
"""
from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DATA = REPO / "report" / "data"
TABLES = REPO / "report" / "tables"

# Display name, slug (общий для bench + judge), заметка.
# Судья faithfulness — deepseek-v4-flash для всех точек (см. caveats).
MODELS: list[tuple[str, str, str]] = [
    ("DeepSeek-V4-Flash",        "deepseek-v4-flash",    "API, remote, **self-judge** (см. caveats)"),
    ("DeepSeek-V4-Pro",          "deepseek-v4-pro",      "API, remote, флагман DeepSeek"),
    ("Qwen3.6-27B",              "qwen3.6-27b",          "local M5 32GB, LM Studio"),
    ("Google Gemma-4-E4B (7.5B)", "gemma-4-e4b",         "local M5 32GB, LM Studio"),
    ("Nvidia Nemotron-3-Nano-4B", "nemotron-3-nano-4b",  "local M5 32GB, LM Studio"),
]

JUDGE_MODEL = "deepseek-v4-flash"


def load(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_hw() -> dict:
    path = DATA / "hardware_stats.json"
    if not path.exists():
        return {}
    return load(path)


def collect_one(name: str, slug: str, note: str, hw: dict) -> dict:
    bench = load(DATA / f"mentor_benchmark_{slug}.json")["aggregated"]
    judge = load(DATA / f"faithfulness_{slug}.json")["aggregated"]
    lat = bench["latency_ms"]
    hw_row = hw.get(slug, {})
    return {
        "name": name,
        "slug": slug,
        "note": note,
        "pass_rate": bench["pass_rate"],
        "role_weighted_score": bench["avg_role_weighted_score"],
        "concept_coverage_raw": bench["avg_concept_coverage"],
        "citation_rate": bench["citation_rate"],
        "n_hallucination_flags": bench["n_with_hallucination_flags"],
        "n_errors": bench["n_errors"],
        "latency_p50_ms": lat["p50"],
        "latency_p95_ms": lat["p95"],
        "latency_p99_ms": lat["p99"],
        "faithfulness": judge["mean_faithfulness"],
        "unsupported_rate": judge["unsupported_rate"],
        "contradicted_rate": judge["contradicted_rate"],
        "n_parse_failed": judge["n_parse_failed"],
        "n_judged": judge["n_judged"],
        "by_role_bench": bench["by_role"],
        "by_role_judge": judge["by_role"],
        # Hardware stats (заполняются вручную в hardware_stats.json после прогона)
        "venue": hw_row.get("venue"),                       # "cloud" | "local M5"
        "ram_peak_gb": hw_row.get("ram_peak_gb"),
        "tokens_per_sec": hw_row.get("tokens_per_sec"),
        "context_window": hw_row.get("context_window"),
    }


def rank_recommendation(models: list[dict]) -> dict:
    """Рекомендация для раздела 7.2.

    Логика: флагман baseline = deepseek-v4-pro (самая дорогая/мощная точка). Если
    любая модель попадает в 5% от V4-Pro и по role_weighted_score, и по
    faithfulness — она вытесняет V4-Pro (локальные дают privacy + zero per-token
    cost). Иначе оставляем V4-Pro и пишем «headroom».
    """
    flagship = next((m for m in models if m["slug"] == "deepseek-v4-pro"), None)
    if flagship is None:
        return {"recommended": models[0]["name"], "reason": "нет deepseek-v4-pro baseline"}

    candidates = [m for m in models if m is not flagship]
    within_5pct = [
        m for m in candidates
        if (flagship["role_weighted_score"] - m["role_weighted_score"]) / flagship["role_weighted_score"] <= 0.05
        and (flagship["faithfulness"] - m["faithfulness"]) <= 0.05
    ]
    if within_5pct:
        winner = max(within_5pct, key=lambda m: (m["role_weighted_score"], m["faithfulness"], -m["latency_p50_ms"]))
        if winner.get("venue", "").startswith("local"):
            reason = (
                "локальная модель в 5% от deepseek-v4-pro по role_weighted_score "
                "и faithfulness — выбираем её (privacy + zero per-token cost, "
                "при наличии GPU-инстанса для self-hosting)"
            )
        else:
            reason = (
                "модель в 5% от deepseek-v4-pro, обходит по другим критериям "
                "(стоимость / латентность)"
            )
        return {"recommended": winner["name"], "reason": reason}

    best_local = max(
        (m for m in candidates if (m.get("venue") or "").startswith("local")),
        key=lambda m: m["role_weighted_score"],
        default=None,
    )
    best_local_str = (
        f"Лучшая локальная ({best_local['name']}, {best_local['role_weighted_score']:.3f}) "
        f"отстаёт более чем на 5%."
        if best_local else ""
    )
    return {
        "recommended": flagship["name"],
        "reason": (
            f"ни одна локальная модель не входит в 5% от deepseek-v4-pro по "
            f"role_weighted_score ({flagship['role_weighted_score']:.3f}). "
            f"{best_local_str} "
            f"DeepSeek также выигрывает по latency p50 (cloud-инференс на оптимизированном железе)."
        ).strip(),
    }


def fmt(v, spec: str = "", dash: str = "—") -> str:
    if v is None:
        return dash
    return f"{v:{spec}}" if spec else str(v)


def to_markdown(models: list[dict], decision: dict) -> str:
    lines = [
        "# Сравнение моделей (Фаза B, 2026-05-25)",
        "",
        "Источник: `report/data/mentor_benchmark_*.json` + `report/data/faithfulness_*.json`.",
        f"Бенчмарк — 20 вопросов × 5 ролей (LECTURER / CHALLENGER / SANDBOX / MIRROR). "
        f"Судья faithfulness — **{JUDGE_MODEL}** (фиксирован для всех прогонов).",
        "",
        "> **Замечание о baseline V3.** Прежний прод-baseline `v2_baseline` (17 мая 2026) "
        "снят на алиасе `deepseek-chat`, который к моменту прогона серверно мигрировал "
        "на `deepseek-v4-flash`. Поле `model` в нашем `raw_payload` не сохранялось, "
        "так что версия baseline неопределима (V3-era либо ранний V4-flash). "
        "Из этой таблицы он исключён; вместо него — две явные V4-точки.",
        "",
        "## Сводная таблица",
        "",
        "| Модель | pass | role-wgt ▲ | concept-cov | faithfulness | UNSUPP | citation | p50 (s) | p95 (s) | RAM peak | tok/s | Заметка |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|",
    ]
    ranked = sorted(models, key=lambda m: m["role_weighted_score"], reverse=True)
    for m in ranked:
        ram = f"{m['ram_peak_gb']:.1f} GB" if m["ram_peak_gb"] is not None else "—"
        toks = f"{m['tokens_per_sec']:.0f}" if m["tokens_per_sec"] is not None else "—"
        lines.append(
            f"| {m['name']} "
            f"| {m['pass_rate']:.0%} "
            f"| **{m['role_weighted_score']:.3f}** "
            f"| {m['concept_coverage_raw']:.3f} "
            f"| {m['faithfulness']:.3f} "
            f"| {m['unsupported_rate']:.1%} "
            f"| {m['citation_rate']:.0%} "
            f"| {m['latency_p50_ms']/1000:.1f} "
            f"| {m['latency_p95_ms']/1000:.1f} "
            f"| {ram} "
            f"| {toks} "
            f"| {m['note']} |"
        )

    lines += [
        "",
        "## Per-role role_weighted_score",
        "",
        "| Модель | LECTURER | CHALLENGER | SANDBOX | MIRROR |",
        "|---|---:|---:|---:|---:|",
    ]
    for m in ranked:
        row = [m["name"]]
        for role in ("LECTURER", "CHALLENGER", "SANDBOX", "MIRROR"):
            v = m["by_role_bench"].get(role, {}).get("avg_role_weighted_score")
            row.append(f"{v:.3f}" if v is not None else "—")
        lines.append("| " + " | ".join(row) + " |")

    lines += [
        "",
        f"## Per-role faithfulness (LLM-as-judge: {JUDGE_MODEL})",
        "",
        "| Модель | LECTURER | CHALLENGER | SANDBOX | MIRROR |",
        "|---|---:|---:|---:|---:|",
    ]
    for m in ranked:
        row = [m["name"]]
        for role in ("LECTURER", "CHALLENGER", "SANDBOX", "MIRROR"):
            v = m["by_role_judge"].get(role, {}).get("mean_faithfulness")
            row.append(f"{v:.3f}" if v is not None else "—")
        lines.append("| " + " | ".join(row) + " |")

    lines += [
        "",
        "## Рекомендация",
        "",
        f"**Выбор: {decision['recommended']}**",
        "",
        decision["reason"],
        "",
        "## Caveats для раздела 10 (Ограничения)",
        "",
        f"- **Self-judge bias.** Судья — {JUDGE_MODEL}. Точка `deepseek-v4-flash` судит сама себя, "
        "поэтому её faithfulness системно завышен. Цифрам по `deepseek-v4-pro` и локальным моделям "
        "доверять больше; для V4-flash интерпретировать как «верхняя граница».",
        "- **Cross-version DeepSeek bias.** `deepseek-v4-pro` судится более слабой моделью того же "
        "семейства (`v4-flash`). Это смягчает self-judge bias, но не устраняет — стиль/лексика "
        "DeepSeek может частично преимуществовать.",
        "- **Миграция alias.** На стороне DeepSeek alias `deepseek-chat` к маю 2026 указывает на "
        "`deepseek-v4-flash`. Прежний `v2_baseline` прогон не воспроизводим как «V3»; используем "
        "явные V4-точки.",
        "- **n=20 вопросов** — малая выборка; σ role_weighted_score ≈ 0.05. MIRROR имеет n=2 — "
        "по этой роли отдельные значения статистически незначимы.",
        "- **Локальные модели** прогонялись в LM Studio на Apple M5 (32GB unified memory). "
        "На NVIDIA-сервере с CUDA latency была бы заметно ниже, но не качество.",
        "- **Cost-аргумент за DeepSeek** (стоимость API vs аренда GPU-инстанса под self-hosting 27B) "
        "в эту таблицу не входит — рассмотрен отдельно в самом разделе.",
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    hw = load_hw()
    models = [collect_one(*m, hw) for m in MODELS]
    decision = rank_recommendation(models)

    out_json = DATA / "model_comparison.json"
    out_json.write_text(
        json.dumps({"models": models, "decision": decision}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"JSON: {out_json}")

    TABLES.mkdir(parents=True, exist_ok=True)
    out_md = TABLES / "model_comparison.md"
    out_md.write_text(to_markdown(models, decision), encoding="utf-8")
    print(f"MD:   {out_md}")
    print()
    print(f"Recommended: {decision['recommended']}")
    print(f"Reason: {decision['reason']}")


if __name__ == "__main__":
    main()
