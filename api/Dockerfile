# syntax=docker/dockerfile:1

# ---- dependencies ----------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runtime ---------------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY scripts ./scripts

# node:alpine already ships an unprivileged `node` user (uid 1000).
USER node

EXPOSE 8700

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT:-8700}/api/health || exit 1

CMD ["node", "src/server.js"]
