import { readFileSync } from "node:fs";
import { resolveFromRepoRoot } from "../paths";
import type { LearningContext } from "@mindflow/shared/llmTypes";

export type SelectedRole = "LECTURER" | "MIRROR" | "SANDBOX" | "CHALLENGER";
export type AuthorRole = "METHODIST";

type SuggestedTone = "поддерживающий" | "нейтральный" | "требовательный";

export interface OrchestratorResponse {
  selected_role: SelectedRole;
  reasoning: string;
  priority_focus: string;
  suggested_tone: SuggestedTone;
}

export const ORCHESTRATOR_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["selected_role", "reasoning", "priority_focus", "suggested_tone"],
  properties: {
    selected_role: {
      type: "string",
      enum: ["LECTURER", "MIRROR", "SANDBOX", "CHALLENGER"],
    },
    reasoning: { type: "string", minLength: 3 },
    priority_focus: { type: "string", minLength: 3 },
    suggested_tone: {
      type: "string",
      enum: ["поддерживающий", "нейтральный", "требовательный"],
    },
  },
} as const;

const roleToPromptFile: Record<SelectedRole, string> = {
  LECTURER: "lecturer.md",
  MIRROR: "mirror.md",
  SANDBOX: "sandbox.md",
  CHALLENGER: "challenger.md",
};

export function loadMethodistTemplate(): string {
  const filePath = resolveFromRepoRoot("prompts", "methodist.md");
  return readFileSync(filePath, "utf-8");
}

export function validateOrchestratorResponse(payload: unknown): payload is OrchestratorResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const data = payload as Record<string, unknown>;
  const keys = Object.keys(data);
  const required = ORCHESTRATOR_RESPONSE_SCHEMA.required;

  if (keys.length !== required.length || !required.every((k) => keys.includes(k))) {
    return false;
  }

  return (
    ["LECTURER", "MIRROR", "SANDBOX", "CHALLENGER"].includes(String(data.selected_role)) &&
    typeof data.reasoning === "string" &&
    data.reasoning.trim().length >= 3 &&
    typeof data.priority_focus === "string" &&
    data.priority_focus.trim().length >= 3 &&
    ["поддерживающий", "нейтральный", "требовательный"].includes(String(data.suggested_tone))
  );
}

export function localPolicyRouter(context: LearningContext): SelectedRole {
  const input = context.user_input.toLowerCase();
  const page = context.current_page.toLowerCase();

  if (page.includes("практи") && /что это|объясни|как работает/.test(input)) {
    return "LECTURER";
  }

  if (page.includes("теори") && /к делу|задач|попробовать|практик/.test(input)) {
    return "SANDBOX";
  }

  if (/проверь|уверен|докажи что я прав/.test(input)) {
    return "CHALLENGER";
  }

  if (/не понимаю|сомневаюсь|путаюсь/.test(input) || /повторяю одну и ту же ошибку/.test(context.knowledge_graph_summary.toLowerCase())) {
    return "MIRROR";
  }

  if (/как сделать|дай задачу|хочу попробовать/.test(input)) {
    return "SANDBOX";
  }

  if (/что это|как работает|объясни/.test(input)) {
    return "LECTURER";
  }

  return "LECTURER";
}

export function loadPromptTemplate(role: SelectedRole): string {
  const filePath = resolveFromRepoRoot("prompts", roleToPromptFile[role]);
  return readFileSync(filePath, "utf-8");
}

export function loadOrchestratorTemplate(): string {
  const filePath = resolveFromRepoRoot("prompts", "orchestrator.md");
  return readFileSync(filePath, "utf-8");
}

// Templates are now placeholder-free, so this is a no-op kept for compatibility.
// Dynamic context flows through buildContextMessage / buildUserMessage instead,
// keeping the system prompt byte-identical across calls (prefix cache hit).
export function renderPromptTemplate(template: string, _context: LearningContext): string {
  return template;
}

const CONTEXT_KEYS_FULL = [
  "current_topic",
  "current_page",
  "level",
  "experience",
  "interests",
  "recent_topics",
  "mastered_concepts",
  "weak_concepts",
  "knowledge_graph_summary",
  "graph_context",
  "retrieved_theory",
] as const;

const CONTEXT_KEYS_ORCHESTRATOR = [
  "current_topic",
  "current_page",
  "level",
  "experience",
  "interests",
  "knowledge_graph_summary",
] as const;

function formatContextLines(context: LearningContext, keys: readonly (keyof LearningContext)[]): string {
  return keys
    .map((key) => {
      const value = context[key];
      const text = value === undefined || value === null ? "" : String(value).trim();
      return text.length > 0 ? `${key}: ${text}` : null;
    })
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function buildContextMessage(context: LearningContext): string {
  let historyBlock = '';
  if (context.conversation_history && context.conversation_history.length > 0) {
    const lines = context.conversation_history.map((m) =>
      `${m.role === 'user' ? 'Студент' : 'Ментор'}: ${m.content.slice(0, 500)}`,
    );
    historyBlock = `ИСТОРИЯ ДИАЛОГА (последние сообщения):\n${lines.join('\n')}\n\n`;
  }
  const block = formatContextLines(context, CONTEXT_KEYS_FULL);
  const contextPart = block ? `КОНТЕКСТ:\n${block}` : '';
  return `${historyBlock}${contextPart}\n\nЗАПРОС: ${context.user_input}`.trim();
}

export function buildOrchestratorUserMessage(context: LearningContext): string {
  const block = formatContextLines(context, CONTEXT_KEYS_ORCHESTRATOR);
  return block ? `КОНТЕКСТ:\n${block}\n\nuser_input: ${context.user_input}` : context.user_input;
}

export function buildSystemPrompt(
  context: LearningContext,
  orchestratorOutput?: unknown,
): { role: SelectedRole; systemPrompt: string; usedFallback: boolean } {
  const validated = validateOrchestratorResponse(orchestratorOutput);
  const role = validated ? orchestratorOutput.selected_role : localPolicyRouter(context);

  return {
    role,
    systemPrompt: loadPromptTemplate(role),
    usedFallback: !validated,
  };
}
