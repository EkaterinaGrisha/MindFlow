# syntax=docker/dockerfile:1.7

# ── Stage 1: Build Vite SPA ──────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

# Install only what's needed to build the SPA
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

# Install workspace deps (--ignore-scripts to skip API native builds — web doesn't need them)
RUN npm ci --workspaces --include-workspace-root --no-audit --no-fund --ignore-scripts

# Copy sources
COPY tsconfig*.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web

# Build (VITE_* env vars can be passed at build time via --build-arg)
ARG VITE_API_BASE_URL=/api
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY=
ARG VITE_PLAUSIBLE_DOMAIN=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_PLAUSIBLE_DOMAIN=$VITE_PLAUSIBLE_DOMAIN

RUN npm run build -w @mindflow/web

# ── Stage 2: nginx alpine serves the static SPA ──────────────────────────────
FROM nginx:1.27-alpine AS runner

# SPA-aware nginx config: fallback to index.html for client-side routing,
# proxy /api/* to the API container (set up via docker-compose).
RUN rm /etc/nginx/conf.d/default.conf

COPY <<'EOF' /etc/nginx/conf.d/mindflow.conf
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy — assumes API container is reachable as "api" on port 8787
    location /api/ {
        proxy_pass http://api:8787/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Static asset caching
    location ~* \.(js|css|woff2?|svg|png|jpg|jpeg|gif|ico)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
