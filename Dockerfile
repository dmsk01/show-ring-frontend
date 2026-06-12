# syntax=docker/dockerfile:1.7
#
# Multi-stage build фронта Show Ring (Next.js 16, standalone).
# deps → build → runner. runner — slim без dev-зависимостей, non-root.
# Один процесс `node server.js` слушает 8082 (как npm start).

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Дефолты NEXT_PUBLIC_* (serverUrl='/api', auth=jwt) годятся для прода —
# секреты на билде не нужны.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8082 \
    HOSTNAME=0.0.0.0
# node:22-slim уже содержит non-root пользователя `node` (uid/gid 1000) —
# переиспользуем его, не создаём своего (иначе groupadd: GID 1000 exists).
# standalone-артефакты: сервер + статика + public.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 8082
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8082/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
