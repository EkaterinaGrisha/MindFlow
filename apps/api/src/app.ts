import express from "express";
import { config } from "./config";
import { corsPolicy } from "./middleware/corsPolicy";
import { errorHandler } from "./middleware/errorHandler";
import { requestId } from "./middleware/requestId";
import {
  createLlmRouter,
  FallbackLlmClient,
  CloudflareWorkersAiLlmClient,
  DeepSeekLlmClient,
  OpenRouterLlmClient,
  type LlmClient,
} from "./llmEndpoint";
import { requireAuth } from "./middleware/requireAuth";
import { updateMastery } from "./llm/knowledgeGraph";
import { createRagRouter } from "./ragEndpoint";
import { createAuthorRouter } from "./authorEndpoint";
import { createBillingRouter } from "./billingEndpoint";
import { createPersonalRouter } from "./personalEndpoint";
import { createEventsRouter } from "./eventsEndpoint";
import { createFeedbackRouter } from "./feedbackEndpoint";
import { createAdminRouter } from "./adminEndpoint";
import { createLearningPlansRouter } from "./learningPlansEndpoint";
import { createLecturesRouter } from "./lecturesEndpoint";
import { mountSupabaseProxy } from "./supabaseProxy";
import { createYandexAuthRouter } from "./yandexAuthEndpoint";

function buildLlmClient() {
  // Порядок цепочки: DeepSeek (если ключ есть) → Cloudflare Workers AI → OpenRouter.
  // Если DEEPSEEK_API_KEY не задан, primary автоматически становится Cloudflare,
  // а если и его нет — OpenRouter. FallbackLlmClient просто идёт по списку
  // и переключается на следующий при ошибке.
  const clients: LlmClient[] = [];
  const order: string[] = [];

  if (config.llm.deepseekApiKey) {
    clients.push(new DeepSeekLlmClient(config.llm.deepseekApiKey));
    order.push("deepseek");
  }

  if (config.llm.cloudflareApiToken && config.llm.cloudflareAccountId) {
    clients.push(
      new CloudflareWorkersAiLlmClient(
        config.llm.cloudflareApiToken,
        config.llm.cloudflareAccountId,
      ),
    );
    order.push("cloudflare");
  }

  if (config.llm.openRouterApiKey) {
    clients.push(
      new OpenRouterLlmClient(
        config.llm.openRouterApiKey,
        config.llm.openRouterModel,
      ),
    );
    order.push("openrouter");
  }

  if (clients.length === 0) {
    console.error(
      "[LLM] Не зарегистрирован ни один провайдер. Задай хотя бы один из: " +
        "DEEPSEEK_API_KEY, CLOUDFLARE_API_TOKEN+CLOUDFLARE_ACCOUNT_ID, OPENROUTER_API_KEY.",
    );
  } else {
    console.log(
      `[LLM] Provider chain: ${order.join(" → ")} (primary: ${order[0]})`,
    );
  }

  return new FallbackLlmClient(clients);
}

export function createApp() {
  const app = express();

  // Railway терминирует TLS на своём прокси и проксирует HTTP внутрь.
  // Без trust proxy req.ip = адрес прокси, а не клиента — rate-limit по IP
  // одной пачкой будет ограничивать всех. Один hop достаточно.
  app.set("trust proxy", 1);

  app.use(corsPolicy);
  app.use(requestId);

  mountSupabaseProxy(app);

  app.use(express.json());

  app.get("/health", async (_req, res) => {
    const BUILD_MARKER = "author-chat-full-doc-2026-05-31";
    const providers = [
      config.llm.deepseekApiKey     ? "deepseek"    : null,
      config.llm.cloudflareApiToken ? "cloudflare"  : null,
      config.llm.openRouterApiKey   ? "openrouter"  : null,
    ].filter(Boolean);

    const { getEmbedderStatus } = await import("./llm/localEmbedder");
    const embedder = getEmbedderStatus();

    res.json({
      status: "ok",
      build: BUILD_MARKER,
      providers: providers.length,
      providerList: providers,
      primaryProvider: providers[0] ?? "none",
      embedder: embedder.status,
      embedderLastError: embedder.lastError,
    });
  });

  const llmClient = buildLlmClient();
  app.use(createLlmRouter(llmClient));
  app.use(createRagRouter());
  app.use(createAuthorRouter(llmClient));
  app.use(createBillingRouter());
  app.use(createPersonalRouter());
  app.use(createLecturesRouter(llmClient));
  app.use(createEventsRouter());
  app.use(createFeedbackRouter());
  app.use(createAdminRouter());
  app.use(createLearningPlansRouter(llmClient));
  app.use(createYandexAuthRouter());

  app.post("/api/user/mastery", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const {
        conceptName,
        courseId = "math-for-data-science",
        correct,
        itemId,
        source,
        timeMs,
        hintCount,
      } = req.body as {
        conceptName: string;
        courseId?:   string;
        correct:     boolean;
        itemId?:     string;
        source?:     "quiz" | "sandbox" | "mentor_check" | "challenger" | "other";
        timeMs?:     number;
        hintCount?:  number;
      };
      if (!conceptName || typeof correct !== "boolean") {
        res.status(400).json({ error: "conceptName and correct are required" });
        return;
      }
      await updateMastery(userId, conceptName, courseId, correct, {
        itemId,
        source,
        timeMs,
        hintCount,
      });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.use(errorHandler);

  return app;
}
