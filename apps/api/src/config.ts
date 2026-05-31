import "dotenv/config";

const getEnv = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : undefined;
};

export const config = {
  port: Number(getEnv("PORT") ?? 8787),
  llm: {
    cloudflareDebug: getEnv("CLOUDFLARE_DEBUG") === "1",
    cloudflareApiToken: getEnv("CLOUDFLARE_API_TOKEN"),
    cloudflareAccountId: getEnv("CLOUDFLARE_ACCOUNT_ID"),
    cloudflareModel: getEnv("CLOUDFLARE_MODEL") ?? "@cf/meta/llama-3.1-8b-instruct",
    cloudflareEmbeddingModel:
      getEnv("CLOUDFLARE_EMBEDDING_MODEL") ?? "@cf/baai/bge-small-en-v1.5",
    cloudflareRerankerModel:
      getEnv("CLOUDFLARE_RERANKER_MODEL") ?? "@cf/baai/bge-reranker-base",
    deepseekApiKey: getEnv("DEEPSEEK_API_KEY"),
    deepseekBaseUrl: getEnv("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com/v1",
    deepseekChatModel: getEnv("DEEPSEEK_CHAT_MODEL") ?? "deepseek-chat",
    cloudflareAiGatewayToken: getEnv("CLOUDFLARE_AI_GATEWAY_TOKEN"),
    openRouterApiKey: getEnv("OPENROUTER_API_KEY"),
    openRouterModel: getEnv("OPENROUTER_MODEL") ?? "openrouter/free",
    openRouterEmbeddingModel:
      getEnv("OPENROUTER_EMBEDDING_MODEL") ?? "openai/text-embedding-3-small",
    embeddingProvider: getEnv("EMBEDDING_PROVIDER"),
  },
  auth: {
    supabaseUrl: getEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    adminUserIds: (getEnv("ADMIN_USER_IDS") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
    yandexClientId: getEnv("YANDEX_CLIENT_ID"),
    yandexClientSecret: getEnv("YANDEX_CLIENT_SECRET"),
    yandexRedirectUri: getEnv("YANDEX_REDIRECT_URI"),
    webAppOrigin: getEnv("WEB_APP_ORIGIN"),
  },
  cors: {
    localhostOrigins: ["http://localhost:3000", "http://localhost:5173"],
    productionOrigin: getEnv("WEB_APP_ORIGIN"),
    // Hard-coded prod origins kept so CORS works even if WEB_APP_ORIGIN env var
    // fails to reach the runtime (e.g. Timeweb Apps rollout stuck on old image).
    productionFallbackOrigins: [
      "https://mindflow-edu.ru",
      "https://www.mindflow-edu.ru",
    ],
  },
  rateLimit: {
    llmPerMinute: 60,
  },
  rag: {
    mmrLambda: parseFloat(getEnv("MMR_LAMBDA") ?? "0.6"),
    mmrCandidatePool: parseInt(getEnv("MMR_CANDIDATE_POOL") ?? "16", 10),
    embeddingDim: parseInt(getEnv("EMBEDDING_DIM") ?? "1024", 10),
    localEmbedderModel:
      getEnv("LOCAL_EMBEDDER_MODEL") ?? "onnx-community/Qwen3-Embedding-0.6B-ONNX",
    // Qwen3-Embedding-0.6B ONNX variants on Hugging Face (size on disk):
    //   - q4f16  ~540 MB (fastest, slightly noisier — recommended default)
    //   - int8   ~585 MB
    //   - fp16   ~1.1 GB
    //   - fp32   ~2.3 GB (model.onnx + model.onnx_data)
    localEmbedderDtype: getEnv("LOCAL_EMBEDDER_DTYPE") ?? "q4f16",
    localEmbedderEnabled: getEnv("LOCAL_EMBEDDER_ENABLED") !== "0",
    rrfK: parseInt(getEnv("RRF_K") ?? "60", 10),
    rrfWeightDense: parseFloat(getEnv("RRF_WEIGHT_DENSE") ?? "1.0"),
    rrfWeightLex: parseFloat(getEnv("RRF_WEIGHT_LEX") ?? "0.5"),
    perSourceCap: parseInt(getEnv("RAG_PER_SOURCE_CAP") ?? "2", 10),
  },
} as const;

export function getAllowedOrigins(): string[] {
  const productionOrigins = (config.cors.productionOrigin ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return [
    ...config.cors.localhostOrigins,
    ...config.cors.productionFallbackOrigins,
    ...productionOrigins,
  ];
}
