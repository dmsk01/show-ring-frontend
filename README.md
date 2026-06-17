# Show Ring — frontend

Веб-интерфейс платформы выставок животных **Show Ring**: каталог собак, питомников и помётов,
выставки и заявки, результаты судейства, личный кабинет и админка с ролевым доступом.

Построен на шаблоне **Minimal Kit**: Next.js 16 (App Router), MUI 7, TypeScript.
Бэкенд — FastAPI-сервис Show Ring.

## Стек

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **MUI 7** (Minimal Kit UI), **TypeScript**
- Данные — **SWR**, формы — **react-hook-form** + **zod**
- Auth — JWT в httpOnly-cookie, single-flight 401-refresh
- i18n — RU (по умолчанию) + EN
- Тесты — **Vitest** (юниты) + **Playwright** (e2e)

## Требования

- Node.js >= 20

## Установка и запуск

```sh
npm install
cp .env.example .env   # заполнить при необходимости
npm run dev            # http://localhost:8082
```

Фронт ходит на `/api/*`, которые `next.config.ts` `rewrites()` проксирует в бэкенд
(`BACKEND_URL`, по умолчанию `http://localhost:8000`). Запусти бэкенд Show Ring локально,
чтобы интерфейс получал реальные данные.

### Переменные окружения (`.env.example`)

| Переменная               | Назначение                                |
| ------------------------ | ----------------------------------------- |
| `NEXT_PUBLIC_SERVER_URL` | базовый URL API на клиенте (`/api`)       |
| `BACKEND_URL`            | адрес бэкенда для прокси-rewrites         |
| `DEV_ADMIN_EMAIL`        | креды для e2e-логина (только локально/CI) |
| `DEV_ADMIN_PASSWORD`     | креды для e2e-логина (только локально/CI) |

## Скрипты

```sh
npm run dev            # дев-сервер (порт 8082)
npm run build          # прод-сборка
npm run start          # запуск собранного приложения

npm run lint           # ESLint (импорты сортирует perfectionist)
npm run lint:fix       # автофикс
npm test               # Vitest (юнит-тесты)
npm run test:e2e       # Playwright e2e (нужен живой бэкенд)
```

Гейты перед коммитом: `npx tsc --noEmit`, `npm run lint`, `npm test` — все должны быть зелёными.

## Структура

- `src/app` — роуты App Router (дашборд, публичные страницы, auth)
- `src/sections` — доменные срезы UI (dog, kennel, litter, shows, user…)
- `src/components` — переиспользуемые кирпичи шаблона (hook-form, table, upload, iconify…)
- `src/actions` — SWR-обёртки над API
- `src/auth`, `src/config/permissions.ts`, `src/utils/permissions.ts` — авторизация и RBAC (6 ролей)
- `e2e` — Playwright-сценарии
- `docs` — планы, спеки и дизайн-документы

## Деплой

Собирается в `standalone` Docker-образ (`Dockerfile`, non-root, порт 8082, healthcheck `/healthz`)
и публикуется в ghcr. CI: `lint → tsc → test → build → deploy` (`.github/workflows/ci.yml`,
`.gitlab-ci.yml`). Фронт и бэкенд живут на одном VPS за общим nginx: `/api/*` → бэкенд, `/` → фронт.
Подробности — `docs/superpowers/specs/2026-06-12-frontend-prod-cicd-design.md`.
