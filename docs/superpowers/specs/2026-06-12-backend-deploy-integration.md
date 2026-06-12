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
