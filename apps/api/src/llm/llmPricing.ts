// llmPricing.ts — простой LUT тарифов для перевода token-usage в рубли.
//
// Цены сильно меняются и зависят от модели. Здесь — консервативная оценка
// на 2026-05 (USD/1M токенов), пересчёт в рубли по фиксированному курсу из
// env (LLM_USD_RUB, default 90). Точную бухгалтерию ведём не здесь — это
// telemetry для unit-экономики Pro (заработали 349 ₽ vs потратили N ₽).
//
// Если provider/model не известен — возвращаем 0 и null tokens. Это лучше
// чем угадывать.

export type ProviderId = "deepseek" | "cloudflare" | "openrouter";

interface PricePer1M {
  input: number;   // USD за 1M входных токенов
  output: number;  // USD за 1M выходных
}

// По актуальным публичным прайсам провайдеров на момент написания.
// При смене тарифа — обновить таблицу, исторические записи не пересчитываем.
const PRICING: Record<string, PricePer1M> = {
  // DeepSeek
  "deepseek:deepseek-chat":      { input: 0.27, output: 1.10 },
  "deepseek:deepseek-reasoner":  { input: 0.55, output: 2.19 },

  // Cloudflare Workers AI — большинство open-models дешёвые.
  "cloudflare:@cf/meta/llama-3.1-8b-instruct":      { input: 0.282, output: 0.819 },
  "cloudflare:@cf/qwen/qwen2.5-7b-instruct":        { input: 0.45,  output: 0.85 },
  "cloudflare:@cf/microsoft/phi-3.5-mini-instruct": { input: 0.20,  output: 0.30 },

  // OpenRouter — берём для openai/gpt-4o-mini как "якорь" недорогой модели.
  "openrouter:openai/gpt-4o-mini":         { input: 0.15, output: 0.60 },
  "openrouter:meta-llama/llama-3.1-70b":   { input: 0.30, output: 0.40 },
};

function usdRubRate(): number {
  const raw = process.env.LLM_USD_RUB;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 90;
}

export function estimateCostRub(
  provider: ProviderId,
  model: string,
  inputTokens: number | null,
  outputTokens: number | null,
): number | null {
  if (inputTokens == null || outputTokens == null) return null;
  const key = `${provider}:${model}`;
  const tariff = PRICING[key];
  if (!tariff) return null;
  const usd =
    (inputTokens * tariff.input + outputTokens * tariff.output) / 1_000_000;
  // 4 знака после запятой — рубли с долями копеек, чтобы микропереводы
  // не округлялись в ноль на коротких ответах.
  return Math.round(usd * usdRubRate() * 10_000) / 10_000;
}

export interface TokenUsage {
  provider: ProviderId;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

/** Суммирует usage нескольких вызовов одного запроса (orchestrator + main). */
export function sumUsage(parts: Array<TokenUsage | null | undefined>): TokenUsage | null {
  const real = parts.filter((p): p is TokenUsage => Boolean(p));
  if (real.length === 0) return null;
  // Если разные provider/model — берём последний (main call, не orchestrator).
  const tail = real[real.length - 1];
  return {
    provider: tail.provider,
    model: tail.model,
    inputTokens: real.reduce(
      (acc, p) => acc + (p.inputTokens ?? 0),
      0,
    ) || null,
    outputTokens: real.reduce(
      (acc, p) => acc + (p.outputTokens ?? 0),
      0,
    ) || null,
  };
}
