import express from "express";
import { optionalAuth } from "./middleware/optionalAuth";
import { llmRateLimiter } from "./middleware/rateLimiter";
import { loadMethodistTemplate } from "./llm/orchestration";
import { fetchAllPersonalChunks, buildRetrievedTheory } from "./llm/ragBoundary";
import type { LlmClient } from "./llmEndpoint";

export interface AuthorChatRequest {
  author_content?: string;
  author_request: string;
  topic_hint?: string;
  existing_structure?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  /** Если указан — backend подтянет фрагменты из личного документа пользователя
   *  и подставит их в author_content. */
  personal_source_id?: string;
}

export interface AuthorStructureRequest {
  content: string;
  topic_hint?: string;
}

export interface AuthorImproveRequest {
  section_text: string;
  section_title?: string;
  improve_goal?: "add_examples" | "add_interactive" | "shorten" | "add_quiz" | "general";
}

export interface AuthorGenerateTheoryRequest {
  section_title: string;
  section_summary?: string;
  topic_hint?: string;
  level?: string;
}

// ─── Build METHODIST user message ─────────────────────────────────────────────

function buildMethodistUserMessage(req: AuthorChatRequest): string {
  const lines: string[] = [];
  if (req.topic_hint) lines.push(`topic_hint: ${req.topic_hint}`);
  if (req.existing_structure) lines.push(`existing_structure:\n${req.existing_structure}`);
  if (req.author_content) lines.push(`author_content:\n${req.author_content}`);
  lines.push(`author_request: ${req.author_request}`);
  return lines.join("\n\n");
}

function buildStructureUserMessage(req: AuthorStructureRequest): string {
  const hint = req.topic_hint ? `topic_hint: ${req.topic_hint}\n\n` : "";
  return `${hint}author_request: Проанализируй следующий учебный материал. Предложи структуру (заголовки разделов), дай замечания к каждому разделу, предложи интерактивы из каталога и вопросы самопроверки.\n\nauthor_content:\n${req.content}`;
}

function buildGenerateTheoryUserMessage(req: AuthorGenerateTheoryRequest): string {
  const hint = req.topic_hint ? `topic_hint: ${req.topic_hint}\n\n` : "";
  const summary = req.section_summary ? `section_summary: ${req.section_summary}\n\n` : "";
  const level = req.level ? `level: ${req.level}\n\n` : "";
  return (
    `${hint}${summary}${level}` +
    `author_request: Напиши учебный текст для раздела «${req.section_title}». ` +
    `Структура: краткое введение → объяснение концепции → пример с формулами в LaTeX → контрпример или распространённая ошибка → практическая задача в конце. ` +
    `Объём: ~400–600 слов. Тон: учебник, не лекция.`
  );
}

function buildImproveUserMessage(req: AuthorImproveRequest): string {
  const goalMap: Record<string, string> = {
    add_examples: "добавить примеры и контрпримеры",
    add_interactive: "предложить подходящий интерактив из каталога",
    shorten: "сократить без потери смысла",
    add_quiz: "добавить вопросы для самопроверки",
    general: "дать общие рекомендации по улучшению",
  };
  const goal = goalMap[req.improve_goal ?? "general"] ?? goalMap.general;
  const title = req.section_title ? `section_title: ${req.section_title}\n\n` : "";
  return `${title}author_request: Помоги ${goal} для следующего раздела.\n\nauthor_content:\n${req.section_text}`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export function createAuthorRouter(llmClient: LlmClient) {
  const router = express.Router();

  // POST /api/author/chat — свободный диалог с METHODIST
  router.post(
    "/api/author/chat",
    optionalAuth,
    llmRateLimiter,
    async (req, res, next) => {
      try {
        const body = req.body as AuthorChatRequest;
        if (!body.author_request?.trim()) {
          res.status(400).json({ error: "author_request is required" });
          return;
        }

        // Методисту нужен весь документ целиком (а не top-k по embedding),
        // иначе план курса/структура строится на 8 случайных кусках.
        const enrichedBody: AuthorChatRequest = { ...body };
        const userId = req.user?.id ?? null;
        if (!enrichedBody.author_content?.trim() && userId && body.personal_source_id?.trim()) {
          try {
            const chunks = await fetchAllPersonalChunks(userId, body.personal_source_id.trim());
            if (chunks.length > 0) {
              enrichedBody.author_content = buildRetrievedTheory(chunks);
            }
          } catch (ragErr) {
            console.warn(
              "[author/chat] personal doc fetch failed, continuing without content:",
              ragErr instanceof Error ? ragErr.message : ragErr,
            );
          }
        }

        const systemPrompt = loadMethodistTemplate();
        const userPrompt = buildMethodistUserMessage(enrichedBody);

        // Build messages including history if provided
        const history = body.history ?? [];
        const messages = [
          ...history,
          { role: "user" as const, content: userPrompt },
        ];

        // For providers that only support system+user, collapse history into user message
        const fullUserPrompt =
          history.length > 0
            ? history
                .map((m) => `[${m.role === "user" ? "Автор" : "Методист"}]: ${m.content}`)
                .join("\n") +
              "\n\n[Автор]: " +
              userPrompt
            : userPrompt;

        const response = await llmClient.generateText({
          systemPrompt,
          userPrompt: fullUserPrompt,
        });

        res.json({ response, role: "METHODIST", messages });
      } catch (error) {
        next(error);
      }
    },
  );

  // POST /api/author/structure — разбить контент на структуру
  router.post(
    "/api/author/structure",
    optionalAuth,
    llmRateLimiter,
    async (req, res, next) => {
      try {
        const body = req.body as AuthorStructureRequest;
        if (!body.content?.trim()) {
          res.status(400).json({ error: "content is required" });
          return;
        }
        if (body.content.length > 50_000) {
          res.status(400).json({ error: "content too large (max 50 000 chars)" });
          return;
        }

        const systemPrompt = loadMethodistTemplate();
        const userPrompt = buildStructureUserMessage(body);

        const response = await llmClient.generateText({ systemPrompt, userPrompt });
        res.json({ response, role: "METHODIST" });
      } catch (error) {
        next(error);
      }
    },
  );

  // POST /api/author/generate-theory — сгенерировать учебный текст для раздела
  router.post(
    "/api/author/generate-theory",
    optionalAuth,
    llmRateLimiter,
    async (req, res, next) => {
      try {
        const body = req.body as AuthorGenerateTheoryRequest;
        if (!body.section_title?.trim()) {
          res.status(400).json({ error: "section_title is required" });
          return;
        }

        const systemPrompt = loadMethodistTemplate();
        const userPrompt = buildGenerateTheoryUserMessage(body);

        const response = await llmClient.generateText({ systemPrompt, userPrompt });
        res.json({ response, role: "METHODIST" });
      } catch (error) {
        next(error);
      }
    },
  );

  // POST /api/author/improve — улучшить конкретный раздел
  router.post(
    "/api/author/improve",
    optionalAuth,
    llmRateLimiter,
    async (req, res, next) => {
      try {
        const body = req.body as AuthorImproveRequest;
        if (!body.section_text?.trim()) {
          res.status(400).json({ error: "section_text is required" });
          return;
        }

        const systemPrompt = loadMethodistTemplate();
        const userPrompt = buildImproveUserMessage(body);

        const response = await llmClient.generateText({ systemPrompt, userPrompt });
        res.json({ response, role: "METHODIST" });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
