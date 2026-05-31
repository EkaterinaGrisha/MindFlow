import test from "node:test";
import assert from "node:assert/strict";
import {
  buildContextMessage,
  buildOrchestratorUserMessage,
  buildSystemPrompt,
  loadOrchestratorTemplate,
  loadPromptTemplate,
  localPolicyRouter,
  renderPromptTemplate,
  validateOrchestratorResponse,
  type OrchestratorResponse,
} from "../../apps/api/src/llm/orchestration";
import type { LearningContext } from "../../packages/shared/src/llmTypes";

const baseContext: LearningContext = {
  current_topic: "Графы",
  retrieved_theory: "Теория о графах",
  recent_topics: "Алгоритмы",
  experience: "6 месяцев практики",
  level: "intermediate",
  interests: "робототехника",
  mastered_concepts: "BFS",
  weak_concepts: "Dijkstra",
  knowledge_graph_summary: "иногда повторяю одну и ту же ошибку",
  current_page: "Практика",
  user_input: "Объясни что это",
};

test("validateOrchestratorResponse принимает валидный JSON", () => {
  const payload: OrchestratorResponse = {
    selected_role: "LECTURER",
    reasoning: "Нужен теоретический разбор",
    priority_focus: "Базовые определения",
    suggested_tone: "поддерживающий",
  };

  assert.equal(validateOrchestratorResponse(payload), true);
});

test("validateOrchestratorResponse отклоняет JSON с лишним полем", () => {
  const payload = {
    selected_role: "LECTURER",
    reasoning: "Нужен теоретический разбор",
    priority_focus: "Базовые определения",
    suggested_tone: "поддерживающий",
    extra: true,
  };

  assert.equal(validateOrchestratorResponse(payload), false);
});

test("validateOrchestratorResponse отклоняет JSON с невалидной ролью", () => {
  const payload = {
    selected_role: "COACH",
    reasoning: "Нужен теоретический разбор",
    priority_focus: "Базовые определения",
    suggested_tone: "поддерживающий",
  };

  assert.equal(validateOrchestratorResponse(payload), false);
});

test("buildSystemPrompt использует роль orchestrator при валидном JSON", () => {
  const payload: OrchestratorResponse = {
    selected_role: "CHALLENGER",
    reasoning: "Проверка гипотез",
    priority_focus: "Аргументация",
    suggested_tone: "требовательный",
  };

  const result = buildSystemPrompt(baseContext, payload);

  assert.equal(result.role, "CHALLENGER");
  assert.equal(result.usedFallback, false);
  assert.equal(result.systemPrompt, loadPromptTemplate("CHALLENGER"));
});

test("buildSystemPrompt корректно fallback на localPolicyRouter при невалидном JSON", () => {
  const invalidPayload = {
    selected_role: "COACH",
    reasoning: "bad",
  };

  const expectedRole = localPolicyRouter(baseContext);
  const result = buildSystemPrompt(baseContext, invalidPayload);

  assert.equal(result.role, expectedRole);
  assert.equal(result.usedFallback, true);
});

test("buildSystemPrompt fallback на localPolicyRouter при undefined JSON", () => {
  const expectedRole = localPolicyRouter(baseContext);
  const result = buildSystemPrompt(baseContext, undefined);

  assert.equal(result.role, expectedRole);
  assert.equal(result.usedFallback, true);
});

test("loadPromptTemplate возвращает байт-идентичный текст между вызовами (для prompt cache)", () => {
  const a = loadPromptTemplate("LECTURER");
  const b = loadPromptTemplate("LECTURER");
  assert.equal(a, b);
  assert.ok(!/\{\{/.test(a), "В шаблоне роли не должно остаться {{плейсхолдеров}}");
});

test("loadOrchestratorTemplate тоже без плейсхолдеров", () => {
  const t = loadOrchestratorTemplate();
  assert.ok(!/\{\{/.test(t), "В orchestrator-шаблоне не должно остаться {{плейсхолдеров}}");
});

test("renderPromptTemplate теперь no-op (контекст уезжает в user message)", () => {
  assert.equal(renderPromptTemplate("STATIC", baseContext), "STATIC");
  assert.equal(renderPromptTemplate("x={{unknown_key}}", baseContext), "x={{unknown_key}}");
});

test("buildContextMessage упаковывает контекст и user_input в одно сообщение", () => {
  const message = buildContextMessage(baseContext);
  assert.match(message, /КОНТЕКСТ:/);
  assert.match(message, /current_topic: Графы/);
  assert.match(message, /retrieved_theory: Теория о графах/);
  assert.match(message, /ЗАПРОС: Объясни что это/);
});

test("buildOrchestratorUserMessage не тащит retrieved_theory (узкий контекст)", () => {
  const message = buildOrchestratorUserMessage(baseContext);
  assert.match(message, /current_topic: Графы/);
  assert.doesNotMatch(message, /retrieved_theory/);
  assert.match(message, /user_input: Объясни что это/);
});
