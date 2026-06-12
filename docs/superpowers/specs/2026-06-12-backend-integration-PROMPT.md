# Промт для бэка (show-ring-backend): подключить фронт на тот же VPS

Скопируй этот текст в сессию в репозитории `show-ring-backend`.

---

Фронт Show Ring теперь собирается в Docker-образ и пушится в
`ghcr.io/dmsk01/show-ring-frontend` своим CI. Нужно подключить его к
существующему прод-стеку: фронт и бэк живут на одном VPS за **единым nginx**
(который уже в этом репозитории). Сейчас nginx проксирует всё на `api:8000` —
надо развести трафик: фронт на `/`, API под `/api/`.

**Почему именно так:** это вариант, который вы сами заложили в
`.env.prod.example` (комментарий про `COOKIE_PATH_PREFIX=/api`, «SPA на /,
API под /api/»). Фронт уже зовёт API относительным `/api` (axios `baseURL='/api'`),
а cookie с `Path=/api` тогда совпадёт с путём запросов. Альтернатива (Next сам
проксирует /api) даёт лишний хоп и ненадёжный WebSocket — отклонена.

## Что сделать

1. **`docker-compose.prod.yml` — добавить сервис `web`:**
   - `image: ghcr.io/dmsk01/show-ring-frontend:${WEB_IMAGE_TAG:-latest}`
   - `environment: BACKEND_URL: http://api:8000` (фолбэк для SSR; в проде /api ловит nginx)
   - memory-limit 512M, `restart: unless-stopped`, **без публичных портов** (наружу только nginx).
   - В сервис `nginx` добавить `depends_on: web: { condition: service_healthy }`
     (у образа фронта есть HEALTHCHECK на `/healthz`).
   *Зачем:* образ фронта тянется из ghcr тем же `compose pull/up`, что и api; наружу его не светим.

2. **`deploy/nginx/conf.d/showtail.conf` — разнести `/` и `/api`:**
   - `location /api/auth/` → `proxy_pass http://showtail_api/auth/;` (зона `auth`)
   - `location /api/` → `proxy_pass http://showtail_api/;` (зона `general`) + upgrade-хедеры
     (`proxy_http_version 1.1`, `Upgrade`, `Connection $connection_upgrade`,
     `proxy_read_timeout 3600s`) — под будущие WebSocket.
   - `location /` → `proxy_pass http://showtail_web;` (upstream `web:8082`)
   - Сохранить `location /.well-known/acme-challenge/`.
   *Зачем:* trailing slash в `proxy_pass` срезает префикс `/api` — бэк по-прежнему
   слушает на корне (`/auth`, `/users`, …), менять роуты бэка не надо. `map
   $http_upgrade $connection_upgrade` уже есть в `nginx.conf`. Проверь, что
   `snippets/proxy.conf` не переопределяет `Connection`/`Upgrade`. TLS-блок (443)
   при появлении домена — тем же разбиением.

3. **`.env.prod.example` / `.env` на VPS:**
   - Раскомментировать `COOKIE_PATH_PREFIX=/api` (без этого браузер не приложит
     auth-cookie к `/api/*` — логин «молча» не залогинит).
   - Добавить `WEB_IMAGE_TAG=latest`.

## Приёмка
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
curl -fsS http://localhost/healthz      # → ok   (фронт через nginx)
curl -fsS http://localhost/api/health   # → health JSON (бэк через nginx)
```

## Деплой фронта
CI фронта при пуше в `main` сам пушит образ в ghcr и по SSH делает
`compose pull web && up -d web` в `/opt/showtail`. От бэка нужно лишь, чтобы
сервис `web` существовал в compose (п.1) и были общие SSH/registry-секреты.

Готовые диффы (если нужны построчно) — в репо фронта:
`docs/superpowers/specs/2026-06-12-backend-deploy-integration.md`.
