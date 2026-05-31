import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`🚀 MindFlow API listening on port ${config.port}`);

  // Pre-warm the local embedder right after the port is bound.
  // Doing it at startup avoids a 5–10 s stall on the first real request,
  // and surfaces OOM errors early in Railway logs rather than mid-request.
  // Disabled when LOCAL_EMBEDDER_ENABLED=0 or when a remote provider is preferred.
  const isLocalPreferred =
    config.rag.localEmbedderEnabled &&
    !["cloudflare", "openrouter"].includes(
      (config.llm.embeddingProvider ?? "").toLowerCase(),
    );

  if (isLocalPreferred) {
    import("./llm/localEmbedder")
      .then(({ embedQueryLocal }) =>
        embedQueryLocal("warmup").then(() =>
          console.log("[embedder] local model pre-warmed"),
        ),
      )
      .catch((err) => {
        console.warn(
          "[embedder] pre-warm failed (will retry on first request):",
          err instanceof Error ? err.message : err,
        );
      });
  }
});
