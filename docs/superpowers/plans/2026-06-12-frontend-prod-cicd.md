# Frontend Prod CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Дать фронту Show Ring прод CI/CD (Docker-образ в ghcr + GitHub Actions/GitLab + деплой по SSH), рассчитанный на со-размещение с бэком ShowTail на одном VPS за единым nginx.

**Architecture:** Next.js собирается в `standalone`-образ (node:22, non-root, порт 8082), пушится в `ghcr.io/dmsk01/show-ring-frontend`. На VPS единый nginx (репо бэка) разводит `/api/*`(HTTP+WS)→`api:8000`, `/`→`web:8082`. CI фронта при деплое делает `compose pull web && up -d web` в `/opt/showtail`. Интеграция на стороне бэка оформлена отдельным doc-патчем.

**Tech Stack:** Next.js 16 (App Router, standalone), Docker (multi-stage), GitHub Actions, GitLab CI, nginx, ghcr.io.

**Спека:** `docs/superpowers/specs/2026-06-12-frontend-prod-cicd-design.md`

**Гейты проекта (CLAUDE.md):** `npm run lint` = 0, `npx tsc --noEmit` = 0, `npm test` зелёно. Плюс для образа — `npm run build` зелёно.

---

### Task 1: Удалить припаркованное демо товаров (разблокировать `next build`)

`next build` падает на демо-роутах товаров: они делают server-side axios на относительный `/api` (невалидный URL в Node). Домена «products» у проекта нет. Навигация на product-роуты не ссылается (`ICONS.product` переиспользован для dogs — НЕ трогаем). `product-ssr.ts` импортируют только эти 4 роута.

**Files:**
- Delete: `src/app/dashboard/product/` (вся папка)
- Delete: `src/app/product/` (вся папка)
- Delete: `src/actions/product-ssr.ts`

- [ ] **Step 1: Зафиксировать текущий провал билда**

Run: `npm run build`
Expected: FAIL — `Error: Failed to collect page data for /dashboard/product/[id]` (Invalid URL).

- [ ] **Step 2: Удалить демо-роуты и SSR-экшен**

```bash
git rm -r "src/app/dashboard/product" "src/app/product" "src/actions/product-ssr.ts"
```

- [ ] **Step 3: Убедиться, что на удалённое нет ссылок**

Run: `grep -rn "product-ssr\|app/product\|dashboard/product" src --include=*.ts --include=*.tsx`
Expected: пусто (нет импортов на удалённые файлы). `paths.product`, `src/sections/product`, `_mock` остаются — это норма.

- [ ] **Step 4: Прогнать гейты + билд**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: tsc 0 ошибок; lint 0; vitest зелёно; `next build` завершается без ошибок (`✓ Compiled` и сводка роутов).
Если `next build` падает на ЕЩЁ ОДНОМ припаркованном демо-роуте того же класса (server-side относительный axios) — удалить его аналогично и повторить шаг. Если падение в НАШЕМ домене (dog/kennel/litter/classifieds/shows/blog) — остановиться и разобрать.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore(demo): удалить припаркованное демо товаров (блокер next build)

Демо product-роуты делали server-side axios на относительный /api
(Invalid URL в Node на этапе сборки). Домена products у проекта нет,
навигация на них не ссылается. Разблокирует прод-сборку образа.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Standalone-вывод Next + health-роут

Переключаем прод-сборку на `standalone` (минимальный self-contained сервер для образа) и добавляем `/healthz` для HEALTHCHECK образа и nginx `depends_on`.

**Files:**
- Modify: `next.config.ts:25` (строка `output: ...`)
- Create: `src/app/healthz/route.ts`

- [ ] **Step 1: Включить standalone-вывод**

В `next.config.ts` заменить строку:
```ts
  output: isStaticExport ? 'export' : undefined,
```
на:
```ts
  output: isStaticExport ? 'export' : 'standalone',
```

- [ ] **Step 2: Создать health-роут**

Создать `src/app/healthz/route.ts`:
```ts
// Liveness-проба для HEALTHCHECK образа и nginx depends_on.
// Путь /healthz (не /api) → nginx маршрутизирует на web.
export const dynamic = 'force-static';

export function GET() {
  return new Response('ok', { status: 200 });
}
```

- [ ] **Step 3: Пересобрать и проверить standalone-артефакт**

Run: `npm run build`
Expected: билд зелёный; создан файл `.next/standalone/server.js`.
Run (проверка наличия): `node -e "require('fs').accessSync('.next/standalone/server.js')" && echo OK`
Expected: `OK`.

- [ ] **Step 4: Гейты**

Run: `npx tsc --noEmit && npm run lint`
Expected: 0 ошибок.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts src/app/healthz/route.ts
git commit -m "$(cat <<'EOF'
feat(deploy): standalone-вывод Next + /healthz для прод-образа

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Dockerfile + .dockerignore

Multi-stage образ (deps → build → runner), non-root, порт 8082, HEALTHCHECK на `/healthz`. Симметрия со стилем бэк-Dockerfile.

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Создать `.dockerignore`**

```dockerignore
node_modules
.next
out
dist
build
coverage
.git
.gitignore
.github
.gitlab-ci.yml
*.log
.env*
.vscode
.idea
docs
**/*.spec.ts
**/*.test.ts
playwright-report
test-results
README*.md
```

- [ ] **Step 2: Создать `Dockerfile`**

```dockerfile
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
# non-root (uid 1000 — как в бэк-образе, совместимо с host volumes).
RUN groupadd --gid 1000 app \
    && useradd --uid 1000 --gid app --shell /bin/bash --home /app app
# standalone-артефакты: сервер + статика + public.
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 8082
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8082/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
```

- [ ] **Step 3: Собрать образ**

Run: `docker build -t show-ring-frontend:test .`
Expected: образ собирается без ошибок (финал `naming to docker.io/library/show-ring-frontend:test`).

- [ ] **Step 4: Запустить контейнер и проверить healthz**

Run:
```bash
docker run -d --name srf-test -p 8082:8082 show-ring-frontend:test
sleep 8
curl -fsS http://127.0.0.1:8082/healthz; echo
docker rm -f srf-test
```
Expected: `curl` печатает `ok` (HTTP 200).

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "$(cat <<'EOF'
feat(deploy): multi-stage Dockerfile (standalone, non-root) фронта

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: GitHub Actions CI/CD (`ci.yml`)

Стадии `lint → typecheck → test → build → deploy`. Зеркалит конвенции бэка (ghcr, теги sha+latest, gha-кэш, deploy по SSH с `environment: production`).

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Создать workflow**

```yaml
# CI/CD pipeline фронта Show Ring (GitHub Actions).
#
# Стадии: lint → typecheck → test → build → deploy.
# - lint/typecheck/test — на каждый push и PR.
# - build/deploy — только push в main (не пушим образы с PR).
# Образ → ghcr.io/<owner>/show-ring-frontend (теги sha + latest).
# Деплой: SSH в /opt/showtail, рекриейт web-сервиса (web определён в
# compose бэка). Секреты — те же имена, что у бэка.

name: CI

on:
  push:
    branches: [main]
  pull_request:

env:
  NODE_VERSION: "22"

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm test

  build:
    needs: [lint, typecheck, test]
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write   # пуш в GitHub Container Registry (ghcr.io)
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha
            type=raw,value=latest,enable={{is_default_branch}}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    # environment: production → можно навесить ручной аппрув в настройках репо.
    environment: production
    steps:
      # web-сервис определён в compose бэка (см. doc-патч). Здесь только
      # тянем новый образ и пересоздаём web. Секреты репозитория:
      #   DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY — доступ по SSH
      #   REGISTRY_USER, REGISTRY_TOKEN           — read:packages для ghcr
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            set -e
            cd /opt/showtail
            echo "${{ secrets.REGISTRY_TOKEN }}" | docker login ghcr.io -u "${{ secrets.REGISTRY_USER }}" --password-stdin
            docker compose -f docker-compose.yml -f docker-compose.prod.yml pull web
            docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d web
            docker image prune -f
```

- [ ] **Step 2: Проверить YAML-валидность**

Run: `node -e "const y=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); if(!y.includes('jobs:')) process.exit(1); console.log('OK')"`
Expected: `OK`. (Если установлен `actionlint` — прогнать `actionlint .github/workflows/ci.yml`.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci(deploy): GitHub Actions — lint/tsc/test → ghcr build → SSH deploy

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: GitLab CI зеркало (`.gitlab-ci.yml`)

Эквивалент GitHub-пайплайна (как у бэка) — на случай переезда/зеркала.

**Files:**
- Create: `.gitlab-ci.yml`

- [ ] **Step 1: Создать `.gitlab-ci.yml`**

```yaml
# CI/CD pipeline фронта Show Ring (GitLab CI).
# Зеркало .github/workflows/ci.yml. Стадии: lint → test → build → deploy.
# build пушит образ в $CI_REGISTRY_IMAGE. ВНИМАНИЕ: при использовании
# GitLab Registry заменить образ web в docker-compose.prod.yml бэка
# (сейчас захардкожен на ghcr.io) на $CI_REGISTRY_IMAGE.

stages: [lint, test, build, deploy]

default:
  image: node:22-slim

variables:
  npm_config_cache: "$CI_PROJECT_DIR/.cache/npm"

cache:
  key: "npm-$CI_COMMIT_REF_SLUG"
  paths:
    - .cache/npm

lint:
  stage: lint
  script:
    - npm ci
    - npm run lint
    - npx tsc --noEmit

test:
  stage: test
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: docker:27
  services:
    - docker:27-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
  script:
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA" -t "$CI_REGISTRY_IMAGE:latest" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA"
    - docker push "$CI_REGISTRY_IMAGE:latest"
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy:
  stage: deploy
  image: alpine:3.20
  before_script:
    - apk add --no-cache openssh-client docker-cli
    - eval $(ssh-agent -s)
    - echo "$DEPLOY_SSH_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh && chmod 700 ~/.ssh
    - ssh-keyscan "$DEPLOY_HOST" >> ~/.ssh/known_hosts 2>/dev/null
  script:
    # web-сервис определён в compose бэка; здесь только pull+recreate web.
    # Нужные CI/CD variables (protected): DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY.
    - ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd /opt/showtail
        && docker compose -f docker-compose.yml -f docker-compose.prod.yml pull web
        && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d web
        && docker image prune -f"
  environment:
    name: production
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
```

- [ ] **Step 2: Проверить YAML-валидность**

Run: `node -e "const y=require('fs').readFileSync('.gitlab-ci.yml','utf8'); if(!y.includes('stages:')) process.exit(1); console.log('OK')"`
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add .gitlab-ci.yml
git commit -m "$(cat <<'EOF'
ci(deploy): GitLab CI зеркало пайплайна фронта

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Doc-патч для репо бэка (интеграция на VPS)

Готовые диффы, которые пользователь применяет в `github.com/dmsk01/show-ring-backend`: `web`-сервис в compose, nginx-разводка, cookie-префикс.

**Files:**
- Create: `docs/superpowers/specs/2026-06-12-backend-deploy-integration.md`

- [ ] **Step 1: Создать документ**

Содержимое:
````markdown
# Бэк-патч: интеграция фронта Show Ring на одном VPS

Применять в репо `show-ring-backend` (на VPS — `/opt/showtail`). После
применения: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`.

## 1. `docker-compose.prod.yml` — сервис `web` + depends_on у nginx

Добавить сервис:
```yaml
  web:
    image: ghcr.io/dmsk01/show-ring-frontend:${WEB_IMAGE_TAG:-latest}
    environment:
      # Фолбэк для возможных server-side вызовов Next; в проде /api ловит nginx.
      BACKEND_URL: http://api:8000
    deploy:
      resources:
        limits:
          memory: 512M
    restart: unless-stopped
    # Без публичных портов — наружу только nginx.
```
В сервис `nginx` добавить зависимость:
```yaml
    depends_on:
      api:
        condition: service_started
      web:
        condition: service_healthy
```

## 2. `deploy/nginx/conf.d/showtail.conf` — разводка / и /api

Заменить тело `server { listen 80; ... }` на:
```nginx
upstream showtail_api { server api:8000; }
upstream showtail_web { server web:8082; }

server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ { root /var/www/certbot; }

    # Auth под /api/auth/ — жёсткая зона.
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        include /etc/nginx/snippets/proxy.conf;
        proxy_pass http://showtail_api/auth/;
    }

    # API + будущие WebSocket — под /api/, срезаем префикс. WS-capable.
    location /api/ {
        limit_req zone=general burst=40 nodelay;
        include /etc/nginx/snippets/proxy.conf;
        proxy_pass http://showtail_api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 3600s;
    }

    # Всё остальное — фронт.
    location / {
        limit_req zone=general burst=40 nodelay;
        include /etc/nginx/snippets/proxy.conf;
        proxy_pass http://showtail_web;
    }
}
```
Примечания:
- `proxy_pass` с trailing slash (`/auth/`, `/`) срезает префикс `/api` — бэк по-прежнему слушает на корне.
- `map $http_upgrade $connection_upgrade` уже есть в `nginx.conf` — не дублировать.
- Проверить `snippets/proxy.conf`: не должен переопределять `Connection`/`Upgrade`.
- TLS-блок (443) при появлении домена строить тем же разбиением (инструкция в шапке файла).

## 3. `.env.prod.example` / `.env` на VPS

Раскомментировать/добавить:
```dotenv
COOKIE_PATH_PREFIX=/api
WEB_IMAGE_TAG=latest
```
Без `COOKIE_PATH_PREFIX=/api` браузер не приложит auth-cookie к `/api/*`.

## 4. Приёмка
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
curl -fsS http://localhost/healthz        # фронт через nginx → ok
curl -fsS http://localhost/api/health     # бэк через nginx → health JSON
```
````

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-06-12-backend-deploy-integration.md
git commit -m "$(cat <<'EOF'
docs(deploy): doc-патч бэка для интеграции фронта на одном VPS

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Финальная сверка гейтов

**Files:** нет (только проверки).

- [ ] **Step 1: Полный прогон гейтов**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: tsc 0; lint 0; vitest зелёно; `next build` зелёный + `.next/standalone/server.js` на месте.

- [ ] **Step 2: Финальная сборка образа**

Run: `docker build -t show-ring-frontend:test . && docker run -d --name srf-final -p 8082:8082 show-ring-frontend:test && sleep 8 && curl -fsS http://127.0.0.1:8082/healthz; echo; docker rm -f srf-final`
Expected: образ собран; `curl` печатает `ok`.

- [ ] **Step 3: Обновить заметку в CLAUDE.md (опц.)**

В `CLAUDE.md` устаревшая фраза про падение `npm run build` на `/dashboard/post/[title]` — заменить на актуальную: блокер был на демо `product`-роутах и устранён удалением. (Согласовать с пользователем перед правкой CLAUDE.md.)

---

## Self-Review (выполнено автором плана)

- **Покрытие спеки:** A1(standalone)→T2; A2(healthz)→T2; A3(Dockerfile)→T3; A4(.dockerignore)→T3; A5(удаление демо)→T1; A6(GH Actions)→T4; A7(GitLab)→T5; A8/часть B(doc-патч)→T6; гейты→T7. Все пункты покрыты.
- **Плейсхолдеры:** нет — все файлы приведены целиком.
- **Согласованность:** порт 8082, образ `ghcr.io/${{ github.repository }}`=`show-ring-frontend`, секреты `DEPLOY_*`/`REGISTRY_*`, `/healthz`, `COOKIE_PATH_PREFIX=/api`, `WEB_IMAGE_TAG` — единообразны во всех тасках и doc-патче.
- **Риск fail-fast билда:** T1 Step 4 содержит инструкцию на случай ещё одного скрытого демо-блокера того же класса.
