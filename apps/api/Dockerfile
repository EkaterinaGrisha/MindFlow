# syntax=docker/dockerfile:1.7

# ── Base: Node 22 (LTS), Debian-slim for native deps support ─────────────────
FROM node:22-slim AS base

WORKDIR /app

# Install build essentials for native modules (onnxruntime needs them on first run)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

# ── Dependencies layer (cached) ──────────────────────────────────────────────
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

RUN npm ci --workspaces --include-workspace-root --no-audit --no-fund

# ── Application code ─────────────────────────────────────────────────────────
COPY tsconfig*.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY prompts prompts

# Hugging Face transformers cache (Qwen3 эмбеддер ~1 GB при первом запуске)
ENV HF_HOME=/app/.cache/huggingface
RUN mkdir -p $HF_HOME && chown -R node:node $HF_HOME

USER node

EXPOSE 8787

# Healthcheck — простая проверка живости API
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://localhost:8787/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "run", "start", "--workspace=@mindflow/api"]
