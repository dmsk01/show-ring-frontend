# Design: прод CI/CD фронта (Show Ring) на одном VPS с бэком

Дата: 2026-06-12
Статус: согласовано (brainstorming) → готово к плану

## Контекст и цель

Бэкенд **ShowTail** (`github.com/dmsk01/show-ring-backend`, локально
`E:\Coding\python-animal-platform`) уже имеет зрелый прод-стек:

- Multi-stage `Dockerfile` (builder → runtime, non-root uid 1000, HEALTHCHECK на `/health`).
- `docker-compose.yml` (база) + `docker-compose.prod.yml` (оверлей: образы из ghcr, nginx, certbot, backup).
- Единый **nginx** — единственный наружный сервис (порты 80/443), проксирует на `api:8000`,
  rate-limit зоны, WebSocket-upgrade, TLS через certbot (profile `tls`).
- CI задублирован: `.github/workflows/ci.yml` (GitHub Actions) + `.gitlab-ci.yml` (зеркало),
  стадии `lint → test → build → deploy`. Образы → `ghcr.io/dmsk01/show-ring-backend` (теги `sha`+`latest`).
- Деплой: SSH в `/opt/showtail` → `git pull --ff-only` → `compose pull` → `run --rm migrate` → `up -d`.
- Прод-секреты в `.env` на VPS (вне git), шаблон `.env.prod.example`.

Фронт (`github.com/dmsk01/show-ring-frontend`) — Next.js 16 (App Router, MUI 7), cookie-auth
(httpOnly), axios `baseURL='/api'`, `serverUrl='/api'` (относительный, зовётся из браузера).
**У фронта сейчас нет ни Dockerfile, ни CI/CD.**

**Цель:** дать фронту прод CI/CD, симметричный конвенциям бэка, рассчитанный на со-размещение
с бэком на одном VPS за единым nginx.

## Согласованные решения

| # | Решение | Выбор |
|---|---------|-------|
| 1 | Границы изменений | **Только репо фронта.** Изменения для бэка оформляются отдельным doc-патчем, который применяет пользователь. |
| 2 | Топология nginx | nginx делит: `/api/*` (HTTP + WS) → бэк, `/` → web (Next). `COOKIE_PATH_PREFIX=/api`. Это вариант, заранее заложенный авторами бэка в `.env.prod.example`. |
| 3 | Платформы CI | Обе: GitHub Actions + `.gitlab-ci.yml`-зеркало. |
| 4 | Реестр образов | `ghcr.io/dmsk01/show-ring-frontend` (через `ghcr.io/${{ github.repository }}`). |
| 5 | Координация деплоя | `web`-сервис определён в compose бэка; CI фронта при деплое делает `compose pull web && up -d web`. |
| 6 | Блокер `next build` | Удалить припаркованное демо товаров (server-side axios на относительный `/api`). |

## Архитектура трафика (один VPS)

```
Browser ──443──> nginx (репо бэка, единственный edge)
                  ├─ /.well-known/acme-challenge/  → certbot webroot
                  ├─ /api/auth/*  → strip /api → api:8000   (zone=auth)
                  ├─ /api/*       → strip /api → api:8000   (zone=general, WS-capable)
                  └─ /            → web:8082 (Next.js standalone, SSR)
```

**WebSocket:** во фронте WS-клиента пока нет (notifications/support — в планах). Всё бэковое,
включая будущие WS (`/api/.../ws...`), идёт через `/api/` — локация делается WS-capable
(upgrade-хедеры). Отдельную `/ws/`-локацию не вводим (YAGNI + единый префикс `/api` под cookie).

- Cookie выставляется бэком с `Path=/api` (`COOKIE_PATH_PREFIX=/api`) — браузер прикладывает её
  только к `/api/*`, что совпадает с axios `baseURL='/api'`.
- Фронт-код менять не нужно: он уже зовёт относительный `/api`. В браузере это `https://<домен>/api/*`
  → перехватывает nginx до Next.
- `next.config` rewrites `/api` остаётся как **dev-фолбэк** (в проде nginx перехватывает `/api` раньше Next).

## Часть A — изменения в репо фронта (делаю сам)

### A1. `next.config.ts` — standalone-вывод
```ts
output: isStaticExport ? 'export' : 'standalone',
```
Standalone даёт минимальный self-contained сервер (`.next/standalone/server.js`) — на нём строится тонкий runtime-слой образа. Rewrites и turbopack/webpack-правила не трогаем.

### A2. Health-роут `src/app/healthz/route.ts`
Лёгкий route handler, отдающий `200 OK` (тело `ok`). Нужен для HEALTHCHECK образа и
`depends_on: web healthy` в nginx. Путь `/healthz` (не `/api`) → nginx маршрутизирует его на web.

### A3. `Dockerfile` (multi-stage, симметрия с бэком)
```dockerfile
# syntax=docker/dockerfile:1.7
# Multi-stage build фронта Show Ring (Next.js 16 standalone).
# deps → build → runner. runner — slim без dev-зависимостей, non-root.

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Дефолты NEXT_PUBLIC_* (serverUrl='/api', auth=jwt) подходят для прода —
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
# переиспользуем его (свой groupadd упал бы: GID 1000 exists).
# standalone-артефакты: сервер + статика + public.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 8082
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8082/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
```
Порт 8082 — совпадает с `npm start` фронта. HEALTHCHECK на node-`fetch` (Node 22, без установки curl).

### A4. `.dockerignore`
Исключает `node_modules`, `.next`, `.git`, `out`, `dist`, `coverage`, `*.log`, `.env*`,
`docs`, `tests`/`*.spec.*` (e2e), IDE-каталоги — чтобы build-контекст был тонким и
воспроизводимым.

### A5. Удаление припаркованного демо товаров (разблокировка `next build`)
`next build` падает на демо-роутах, делающих server-side axios на относительный `/api`
(невалидный URL в Node). У проекта нет домена «products» (наши домены: dogs/kennels/litters/
classifieds/shows/blog). Удаляем:

- `src/app/dashboard/product/` (целиком: list, new, `[id]/(details)`, `[id]/edit`, error/loading)
- `src/app/product/` (целиком: list, `[id]`, checkout, layout, error/loading)
- `src/actions/product-ssr.ts`

**Не трогаем:** `src/layouts/nav-config-dashboard.tsx` — отдельного пункта меню product нет,
а `ICONS.product` переиспользован для меню **dogs** (должен остаться). `src/sections/product`,
`paths.ts` (строки путей), `_mock` — держат демо `_examples`, удаление дало бы ripple в `tsc`.

После удаления — итеративно гнать `next build` до зелёного. Если всплывёт ещё один
**припаркованный** демо-роут того же класса (server-side относительный axios на билде) — применить
ту же трактовку (удалить роут). Если всплывёт что-то из **наших** доменов — остановиться и разобрать.

### A6. `.github/workflows/ci.yml`
Стадии `lint → typecheck → test → build → deploy` (зеркалит структуру бэка):

- **lint** (push/PR): `node 22`, `npm ci`, `npm run lint`.
- **typecheck** (push/PR): `npx tsc --noEmit`.
- **test** (push/PR): `npm test` (vitest).
- **build** (`if: github.event_name == 'push'`, ветка main): `docker/setup-buildx`,
  `login` в ghcr (`GITHUB_TOKEN`, `packages: write`), `metadata-action` (теги `type=sha` +
  `latest` на default-branch), `build-push-action` (`context: .`, `cache-from/to: gha`).
  Образ → `ghcr.io/${{ github.repository }}`.
- **deploy** (`needs: build`, `if: refs/heads/main`, `environment: production` — даёт ручной аппрув):
  `appleboy/ssh-action` →
  ```bash
  set -e
  cd /opt/showtail
  echo "$REGISTRY_TOKEN" | docker login ghcr.io -u "$REGISTRY_USER" --password-stdin
  docker compose -f docker-compose.yml -f docker-compose.prod.yml pull web
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d web
  docker image prune -f
  ```
  Секреты — **те же имена**, что у бэка: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`,
  `REGISTRY_USER`, `REGISTRY_TOKEN`.

### A7. `.gitlab-ci.yml` (зеркало)
Стадии `lint/typecheck/test` (image `node:22-slim`), `build` (`docker:27` + dind, push в
`$CI_REGISTRY_IMAGE`), `deploy` (alpine + ssh, `when: manual`, рекриейт `web`). Комментарий:
при переезде на GitLab Registry заменить образ `web` в compose бэка на `$CI_REGISTRY_IMAGE`.

### A8. Документ-патч для бэка
`docs/superpowers/specs/2026-06-12-backend-deploy-integration.md` — готовые диффы (Часть B ниже),
применяет пользователь в репо бэка.

## Часть B — doc-патч для репо бэка (применяет пользователь)

### B1. `docker-compose.prod.yml` — добавить сервис `web`
```yaml
  web:
    image: ghcr.io/dmsk01/show-ring-frontend:${WEB_IMAGE_TAG:-latest}
    environment:
      # Фолбэк для возможных server-side вызовов Next; в проде /api перехватывает nginx.
      BACKEND_URL: http://api:8000
    deploy:
      resources:
        limits:
          memory: 512M
    restart: unless-stopped
    # Без публичных портов — наружу только nginx.
```
`nginx.depends_on` дополнить `web: { condition: service_healthy }`.
В CI бэка `pull`/`up` уже покрывают новый сервис; отдельный реестр-логин для ghcr уже есть.

### B2. `deploy/nginx/conf.d/showtail.conf` — разнести `/`, `/api`, `/ws`
```nginx
upstream showtail_api { server api:8000; }
upstream showtail_web { server web:8082; }

server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ { root /var/www/certbot; }

    # API под /api/ — срезаем префикс (trailing slash в proxy_pass).
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        include /etc/nginx/snippets/proxy.conf;
        proxy_pass http://showtail_api/auth/;
    }
    # API + будущие WebSocket — под /api/, срезаем префикс. WS-capable:
    # upgrade-хедеры (map $connection_upgrade живёт в nginx.conf).
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
TLS-блок (443) при появлении домена строится по тому же разбиению (инструкция в шапке файла бэка).
Проверить `proxy.conf` — не должен переопределять `Connection`/`Upgrade` для `/ws/` (или вынести WS-хедеры явно, как выше). `client_max_body_size 10m` в `nginx.conf` остаётся.

### B3. `.env.prod.example` (и `.env` на VPS) — включить cookie-префикс
```dotenv
COOKIE_PATH_PREFIX=/api
```
(Раскомментировать — иначе браузер не приложит cookie к `/api/*` после переезда API под `/api`.)
Добавить переменную тега фронт-образа: `WEB_IMAGE_TAG=latest`.

## Тестирование / гейты

- **CI-гейты фронта** (мандат CLAUDE.md): `npm run lint` = 0, `npx tsc --noEmit` = 0,
  `npm test` = зелёно. Все три — обязательны до build.
- **`next build`** должен проходить (после удаления демо товаров) — это предпосылка к docker build.
- **Образ**: HEALTHCHECK на `/healthz`; nginx `depends_on: web healthy`.
- **Локальная приёмка**: `docker build` фронта + `docker compose -f ... -f prod up --build` со
  стороны бэка (web+nginx) — проверить, что `/` отдаёт фронт, `/api/health` (через nginx) — бэк.
- **Playwright e2e** в CI **не включаем** (нужен полный стек api+web+nginx) — отдельная задача.

## Вне рамок (YAGNI)

- Полное вырезание домена product из `sections`/`_examples`/`paths` (отдельная чистка демо).
- E2E в CI, smoke-тесты деплоя, blue-green, авто-rollback.
- Изменения TLS/домена (инфраструктура бэка, по готовности домена).
- Любые изменения логики приложения сверх удаления демо-блокера билда.
```
