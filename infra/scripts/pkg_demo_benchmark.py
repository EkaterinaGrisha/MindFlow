"""
pkg_demo_benchmark.py

End-to-end demo + A/B measurement of the PKG-based architecture.

For each (user_id, target_domain) pair we generate exercises twice:
  A) PKG-aware — uses buildStudentProfile to pick exercises that target
     the student's actual weak spots
  B) baseline — same RAG corpus, no profile info, generic exercises

A DeepSeek judge then picks the version more useful to that specific
student, knowing their profile.

This is structurally similar to graph_rag_benchmark.py (mentor answer
comparison), but tests personalization rather than passive augmentation.

Stages:
    1. demo     — run both versions for a configurable set of (user, domain)
                  pairs and save raw results to pkg_demo_results.json
    2. judge    — DeepSeek picks the better of each A/B pair, with profile
                  passed to the judge so it can evaluate FIT, not just quality
    3. report   — render reports/pkg-based-architecture.md
"""

from __future__ import annotations

import argparse
import json
import os
import random
import subprocess
import sys
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(__file__).resolve().parent / "benchmark_data"
DEMO_PATH = DATA_DIR / "pkg_demo_results.json"
JUDGE_PATH = DATA_DIR / "pkg_demo_judges.json"
REPORT_PATH = ROOT / "reports" / "pkg-based-architecture.md"

load_dotenv(ROOT / ".env")
DEEPSEEK_KEY = os.environ["DEEPSEEK_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# ─── Demo pairs ──────────────────────────────────────────────────────────────
# We use real users from the DB so the profile signal is honest. Domain is
# chosen so the user's PKG actually overlaps it (otherwise baseline trivially
# wins for "no relevant data").
DEMO_PAIRS = [
    # Active user with rich profile (8 strong, 8 weak)
    {"user_id_hint": "a67a43d8", "domain": "Линейная алгебра"},
    {"user_id_hint": "a67a43d8", "domain": "Машинное обучение"},
    # Cold-start user — no profile
    {"user_id_hint": "11451fae", "domain": "Линейная алгебра"},
    # Light user — one topic done
    {"user_id_hint": "c9e3bf03", "domain": "Математический анализ"},
]

# ─── Helpers ─────────────────────────────────────────────────────────────────

def deepseek_chat(system: str, user: str, max_tokens: int = 1200, temperature: float = 0.4) -> str:
    r = requests.post(
        "https://api.deepseek.com/chat/completions",
        headers={"Authorization": f"Bearer {DEEPSEEK_KEY}", "Content-Type": "application/json"},
        json={
            "model": "deepseek-chat",
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        },
        timeout=120,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def resolve_user_ids() -> dict[str, str]:
    """Map user_id_hint (first 8 chars) → full UUID by querying DB."""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/personal_kg_nodes?select=user_id",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
        timeout=30,
    )
    r.raise_for_status()
    ids = {row["user_id"] for row in r.json()}
    return {uid[:8]: uid for uid in ids}


# ─── Stage 1: demo (calls TS core via a tsx wrapper) ─────────────────────────

TSX_WRAPPER = """
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { generatePersonalizedExercises } from "./src/llm/personalizedExercises";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const llmGenerate = async (params: { systemPrompt: string; userPrompt: string; maxTokens?: number; temperature?: number }) => {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.4,
      max_tokens: params.maxTokens ?? 1200,
    }),
  });
  const j = await res.json() as any;
  return j.choices[0].message.content.trim();
};

async function main() {
  const userId = process.argv[2];
  const domain = process.argv[3];
  const usePkg = process.argv[4] === "true";
  const result = await generatePersonalizedExercises(userId, domain, supabase, llmGenerate, { usePkg });
  process.stdout.write(JSON.stringify(result));
}
main().catch((e) => { console.error(e); process.exit(1); });
"""

def call_ts_generator(user_id: str, domain: str, use_pkg: bool) -> dict[str, Any]:
    """Invoke the TS core function from Python via a one-shot tsx process."""
    wrapper_path = ROOT / "apps" / "api" / "_pkg_runner.ts"
    wrapper_path.write_text(TSX_WRAPPER)
    try:
        proc = subprocess.run(
            ["npx", "tsx", "_pkg_runner.ts", user_id, domain, "true" if use_pkg else "false"],
            cwd=str(ROOT / "apps" / "api"),
            capture_output=True,
            text=True,
            timeout=180,
        )
        if proc.returncode != 0:
            raise RuntimeError(f"tsx failed: {proc.stderr.strip()[:500]}")
        return json.loads(proc.stdout)
    finally:
        try: wrapper_path.unlink()
        except FileNotFoundError: pass


def stage_demo() -> None:
    id_map = resolve_user_ids()
    print(f"[demo] resolved {len(id_map)} users with PKG data")

    existing: dict[str, dict[str, Any]] = {}
    if DEMO_PATH.exists():
        for r in json.loads(DEMO_PATH.read_text()):
            existing[f"{r['user_id']}::{r['domain']}"] = r
        print(f"[demo] resuming: {len(existing)} (user, domain) pairs already done")

    results: list[dict[str, Any]] = list(existing.values())

    for pair in DEMO_PAIRS:
        hint = pair["user_id_hint"]
        domain = pair["domain"]
        user_id = id_map.get(hint)
        if not user_id:
            print(f"[demo] skip — no user matching hint {hint}")
            continue
        key = f"{user_id}::{domain}"
        if key in existing:
            print(f"[demo] skip — {hint}/{domain} already done")
            continue

        print(f"\n[demo] === user={hint} domain={domain} ===")
        try:
            print(f"[demo]   A) generating WITHOUT PKG (baseline)...")
            baseline = call_ts_generator(user_id, domain, use_pkg=False)
            print(f"[demo]      → {len(baseline.get('exercises', []))} exercises")
            print(f"[demo]   B) generating WITH PKG...")
            with_pkg = call_ts_generator(user_id, domain, use_pkg=True)
            print(f"[demo]      → {len(with_pkg.get('exercises', []))} exercises, fallback={with_pkg.get('used_fallback')}")
        except Exception as e:
            print(f"[demo]   FAILED: {e}")
            continue

        results.append({
            "user_id": user_id,
            "user_hint": hint,
            "domain": domain,
            "profile_summary": {
                "strong": [c["name"] for c in with_pkg["profile"]["strong"]],
                "weak": [c["name"] for c in with_pkg["profile"]["weak"]],
                "goal": with_pkg["profile"]["goal"],
            },
            "targeted_concepts": [c["name"] for c in with_pkg.get("targeted_concepts", [])],
            "baseline_exercises": baseline.get("exercises", []),
            "pkg_exercises": with_pkg.get("exercises", []),
            "pkg_used_fallback": with_pkg.get("used_fallback", False),
        })
        DEMO_PATH.write_text(json.dumps(results, ensure_ascii=False, indent=2))
        print(f"[demo]   saved.")

    print(f"\n[demo] {len(results)} (user, domain) pairs done → {DEMO_PATH}")


# ─── Stage 2: judge (per-pair, profile-aware) ────────────────────────────────

JUDGE_SYSTEM = """Ты — методист-эксперт, который подбирает учебные задачи под конкретного студента.
Для каждой пары задач (A и B) тебе известен профиль студента — что он уже знает, в чём путается, какая цель.
Оцени, какой комплект задач БОЛЬШЕ ПОДХОДИТ ИМЕННО ЭТОМУ СТУДЕНТУ:
- Закрывает ли набор слабые места?
- Не дублирует ли уже разобранные темы?
- Подходит ли уровень сложности?

Ответь одним словом: A, B, или TIE (если одинаково подходят)."""

def fmt_exercises(es: list[dict[str, Any]]) -> str:
    if not es: return "(пусто)"
    lines = []
    for i, e in enumerate(es, 1):
        lines.append(f"{i}. {e['question']}")
        if e.get("hint"): lines.append(f"   подсказка: {e['hint']}")
        if e.get("target_concept"): lines.append(f"   проверяет: {e['target_concept']}")
    return "\n".join(lines)


def stage_judges() -> None:
    if not DEMO_PATH.exists(): sys.exit("[judges] run --stage demo first")
    demos: list[dict[str, Any]] = json.loads(DEMO_PATH.read_text())
    existing = {j["key"]: j for j in json.loads(JUDGE_PATH.read_text())} if JUDGE_PATH.exists() else {}
    print(f"[judges] {len(demos)} demos, {len(existing)} judged")
    rng = random.Random(42)
    out: list[dict[str, Any]] = list(existing.values())

    for d in demos:
        key = f"{d['user_id']}::{d['domain']}"
        if key in existing: continue

        # Cold-start users → no fair comparison (PKG fallback = baseline)
        if d["pkg_used_fallback"] and len(d["profile_summary"]["strong"]) == 0 and len(d["profile_summary"]["weak"]) == 0:
            verdict_raw = "TIE"
            winner = "tie"
            order = "n/a (cold start)"
        else:
            # Randomize order to avoid position bias
            if rng.random() < 0.5:
                ans_a, ans_b = d["baseline_exercises"], d["pkg_exercises"]
                order = "baseline_is_A"
            else:
                ans_a, ans_b = d["pkg_exercises"], d["baseline_exercises"]
                order = "pkg_is_A"

            profile_str = []
            ps = d["profile_summary"]
            if ps["strong"]: profile_str.append(f"Уже знает: {', '.join(ps['strong'])}.")
            if ps["weak"]: profile_str.append(f"Путается: {', '.join(ps['weak'])}.")
            if ps["goal"]: profile_str.append(f"Цель: {ps['goal']}")

            user_prompt = f"""ПРОФИЛЬ СТУДЕНТА:
{chr(10).join(profile_str) if profile_str else "(новый студент, данных мало)"}

ДОМЕН ЗАДАЧ: {d['domain']}

ВАРИАНТ A:
{fmt_exercises(ans_a)}

ВАРИАНТ B:
{fmt_exercises(ans_b)}

Какой комплект задач лучше подходит этому студенту? Ответ: A, B, или TIE."""

            try:
                verdict_raw = deepseek_chat(JUDGE_SYSTEM, user_prompt, max_tokens=20, temperature=0)
            except Exception as e:
                print(f"[judges] failed for {key}: {e}")
                continue

            first = verdict_raw.strip().upper().split()[0]
            if first.startswith("TIE"): winner = "tie"
            elif first.startswith("A"): winner = "baseline" if order == "baseline_is_A" else "pkg"
            elif first.startswith("B"): winner = "pkg" if order == "baseline_is_A" else "baseline"
            else: winner = f"unparseable:{first}"

        out.append({
            "key": key,
            "user_hint": d["user_hint"],
            "domain": d["domain"],
            "order": order,
            "verdict_raw": verdict_raw,
            "winner": winner,
            "n_pkg_exercises": len(d["pkg_exercises"]),
            "n_baseline_exercises": len(d["baseline_exercises"]),
        })
        print(f"[judges] {key[:50]}... order={order} → {winner}")
        JUDGE_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2))

    print(f"\n[judges] {len(out)} verdicts → {JUDGE_PATH}")


# ─── Stage 3: report ─────────────────────────────────────────────────────────

def stage_report() -> None:
    if not JUDGE_PATH.exists(): sys.exit("[report] run judges first")
    judges = json.loads(JUDGE_PATH.read_text())
    demos = json.loads(DEMO_PATH.read_text())
    by_key = {d["user_id"] + "::" + d["domain"]: d for d in demos}

    n = len(judges)
    pkg_w = sum(1 for j in judges if j["winner"] == "pkg")
    base_w = sum(1 for j in judges if j["winner"] == "baseline")
    ties = sum(1 for j in judges if j["winner"] == "tie")

    lines: list[str] = []
    lines.append("# PKG-based architecture — MindFlow proof-of-concept")
    lines.append("")
    lines.append("Демонстрация и измерение **Архитектуры #3 (Personal Knowledge Graph + EduKG)** на реальных пользователях MindFlow.")
    lines.append("")
    lines.append("## Что собрано в эту итерацию")
    lines.append("")
    lines.append("**Слой 1 — Aggregator** (`apps/api/src/llm/studentProfile.ts`):")
    lines.append("- `buildStudentProfile(userId)` объединяет 5 источников: `personal_kg_nodes`, `kg_mastery_summary`, `math_topic_progress`, `mentor_messages`, `learning_plans`")
    lines.append("- Возвращает `{strong, weak, recent, goal}` — выжимка для prompt")
    lines.append("- `formatProfileForPrompt(p)` — короткий 5-7 строк блок")
    lines.append("- `pickWeakInDomain(p, domain)` — фильтр слабостей по домену")
    lines.append("")
    lines.append("**Слой 3 — PKG-driven генерация** (`apps/api/src/llm/personalizedExercises.ts`):")
    lines.append("- `generatePersonalizedExercises(userId, domain, ...)` — главная функция use-case куратора")
    lines.append("- Профиль → слабые концепты в домене → RAG retrieval → DeepSeek генерит 3-5 задач, направленных на gaps")
    lines.append("- Опция `usePkg: false` — для A/B сравнения")
    lines.append("")
    lines.append("## Демо: реальные пользователи из БД")
    lines.append("")
    for d in demos:
        ps = d["profile_summary"]
        lines.append(f"### Пользователь `{d['user_hint']}`, домен «{d['domain']}»")
        lines.append("")
        if ps["strong"] or ps["weak"]:
            if ps["strong"]: lines.append(f"- **Уже знает:** {', '.join(ps['strong'][:6])}")
            if ps["weak"]: lines.append(f"- **Слабые места:** {', '.join(ps['weak'][:6])}")
            if ps["goal"]: lines.append(f"- **Цель:** {ps['goal']}")
        else:
            lines.append("- **Профиль пуст** (cold start)")
        lines.append(f"- **Сфокусированы на концептах:** {', '.join(d['targeted_concepts']) if d['targeted_concepts'] else '— (fallback на общий домен)'}")
        lines.append("")
        lines.append("**PKG-сгенерированные задачи:**")
        for ex in d["pkg_exercises"]:
            tgt = f" *(target: {ex['target_concept']})*" if ex.get("target_concept") else ""
            lines.append(f"- {ex['question']}{tgt}")
        lines.append("")
        lines.append("**Baseline (без PKG) задачи:**")
        for ex in d["baseline_exercises"]:
            lines.append(f"- {ex['question']}")
        lines.append("")

    lines.append("## A/B измерение (DeepSeek-judge)")
    lines.append("")
    lines.append(f"Каждой паре задач (PKG-aware vs baseline) DeepSeek-judge показывался профиль студента и оба варианта. Порядок A/B рандомизирован.")
    lines.append("")
    lines.append("| Вердикт | Кол-во | % |")
    lines.append("|---|---:|---:|")
    if n > 0:
        lines.append(f"| 🏆 PKG-aware подходит студенту лучше | **{pkg_w}** | **{pkg_w/n*100:.0f}%** |")
        lines.append(f"| baseline лучше | {base_w} | {base_w/n*100:.0f}% |")
        lines.append(f"| равноценны (TIE) | {ties} | {ties/n*100:.0f}% |")
    lines.append("")
    for j in judges:
        winner_marker = {"pkg": "🏆 PKG", "baseline": "📚 baseline", "tie": "🤝 TIE"}.get(j["winner"], j["winner"])
        lines.append(f"- `{j['user_hint']}` / «{j['domain']}» → {winner_marker} (order: {j['order']})")
    lines.append("")
    lines.append("## Что показала эта итерация")
    lines.append("")
    if n > 0:
        if pkg_w >= max(base_w, 1) * 1.2 and pkg_w > base_w:
            lines.append("✅ **PKG-архитектура работает на реальных данных** — судья предпочитает персонализированные задачи когда у студента есть осмысленный профиль.")
        elif pkg_w == base_w:
            lines.append("⚖️ **PKG не даёт строгого преимущества** на этом малом сэмпле — нужно больше пользователей с богатыми профилями.")
        else:
            lines.append("🤔 **PKG проигрывает baseline на этом сэмпле** — возможно профиль ещё слишком грубый или DeepSeek-генератор уже хорош с обычным RAG.")
    lines.append("")
    lines.append("**Главное:** теперь у MindFlow есть прямая дорога от «знаем что студент путается в X» к «сгенерируем задачу про X для этого студента». До этой итерации все PKG-данные собирались, но обратно в pipeline не возвращались.")
    lines.append("")
    lines.append("## Ограничения текущего MVP")
    lines.append("")
    lines.append("1. **BKT не работает** — `bkt_attempts = 0` в БД, поэтому `kg_mastery_summary` почти пуст. Сейчас профиль строится в основном из `personal_kg_nodes` (LLM-извлечение из диалогов) и `math_topic_progress`. Когда подключим BKT — сигнал станет точнее.")
    lines.append("2. **EduKG минимальный** — 44 концепта, 9 с `topic_slug`. Для широкого `pickWeakInDomain` нужно расширить (см. `reports/graph-rag-benchmark.md` Вариант A).")
    lines.append("3. **Endpoint не подключён** — пока есть только функция `generatePersonalizedExercises`. HTTP-эндпойнт `/api/llm/personalized-exercises` — следующий шаг.")
    lines.append("4. **Малый сэмпл** — 4 (user, domain) пары. Для статистической убедительности — нужно 30+.")
    lines.append("")
    lines.append("## Что дальше")
    lines.append("")
    lines.append("1. Подключить HTTP endpoint в `app.ts` (15 мин)")
    lines.append("2. Активировать BKT — добавить заданий, чтобы `bkt_attempts` начали расти (отдельная задача)")
    lines.append("3. Расширить EduKG через LLM-extraction (см. graph-rag-benchmark.md Вариант A)")
    lines.append("4. Собрать 30+ (user, domain) пар для статистически значимого A/B")
    lines.append("5. Добавить **Stage 2 PKG-aware LECTURER** — передавать профиль в обычный ответ ментора (не только в генерацию задач)")
    lines.append("")
    lines.append("## Воспроизведение")
    lines.append("")
    lines.append("```bash")
    lines.append("python3 infra/scripts/pkg_demo_benchmark.py --stage all")
    lines.append("```")
    lines.append("")
    lines.append("Данные кешируются — повторный запуск не пересоздаёт уже сделанные пары.")
    lines.append("")
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines))
    print(f"[report] wrote {REPORT_PATH}")


# ─── CLI ────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", required=True, choices=["all", "demo", "judges", "report"])
    args = ap.parse_args()
    if args.stage in ("all", "demo"): stage_demo()
    if args.stage in ("all", "judges"): stage_judges()
    if args.stage in ("all", "report"): stage_report()


if __name__ == "__main__":
    main()
