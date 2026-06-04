# Spec: e2e-тесты для флоу Shows (Playwright, реальный бэкенд)

- **Дата:** 2026-06-04
- **Статус:** утверждён, готов к плану реализации
- **Автор:** Claude (Opus 4.8) + Dmitry Petrov

## Контекст и причина

Пользователь сообщил о 404 при клике на выставку (`/dashboard/shows/{id}/edit`).
Расследование показало, что **код роутов корректен** — 404 был вызван
**повреждённым кэшем turbopack** (`.next/dev/types/routes.d.ts` обрезан, манифест
роутов потерял вложенные маршруты `/dashboard`). Починено очисткой `.next` +
перезапуском dev-сервера. Это нестабильность turbopack на Windows, не баг кода.

Чтобы ловить подобные регрессии маршрутов и проверять бизнес-флоу, нужны e2e-тесты.
Решения по scope (подтверждены пользователем):

- **Фреймворк:** Playwright.
- **Охват:** полные флоу домена **Shows**.
- **Среда:** реальный бэкенд ShowTail на `:8000`.
- **Данные:** бэкенд теперь имеет `DELETE /shows/{show_id}` → 204 (права/статус-гейты
  зеркалят update, у админа доступ есть). Каждый прогон создаёт свежую выставку с
  уникальным именем и в конце **реально удаляет её** через DELETE — без накопления
  мусорных записей в БД.

### Обновление бэкенда (2026-06-04)
Бэкенд добавил hard-delete эндпоинты (`app/routers/shows.py` и др.). Релевантный для
этого спека: `DELETE /shows/{show_id}` → 204. Прочие (`DELETE /dogs/{id}`,
`DELETE /litters/{id}`, `DELETE /shows/{id}/results/{result_id}`, `DELETE /ads/...`,
`DELETE /classifieds/{id}?hard=true`) — вне scope Shows-спека, учитываются при будущих
кросс-доменных e2e. У всех DELETE права и status-гейты зеркалят соответствующий update.

## Архитектура

### Инфраструктура
- `@playwright/test` как devDependency + браузер chromium.
- `playwright.config.ts`:
  - `baseURL: http://localhost:8082`.
  - `testDir: ./e2e`.
  - `webServer`: `command: npm run dev`, `url: http://localhost:8082`,
    `reuseExistingServer: true` — переиспользует уже запущенный dev, не плодит
    turbopack-инстансы.
  - `fullyParallel: false` для shows-спека (последовательный жизненный цикл).
  - проект `setup` (global auth) → проект `chromium` зависит от него
    через `storageState`.
- Тесты в каталоге `e2e/`, изолированы от `vitest` (vitest читает только `src/**`).
- npm-скрипты: `test:e2e`, `test:e2e:ui`.
- `.gitignore`: `e2e/.auth/`, `test-results/`, `playwright-report/`.
- Конфиги (`playwright.config.ts`, `e2e/**`) не должны ломать `tsc --noEmit` и `lint`.

### Авторизация
**Подход (выбран):** глобальный setup-проект через реальный UI-логин.
- Заходим на `/auth/jwt/sign-in` (поля предзаполнены админом
  `admin@admin.com` / `Password123!`), жмём **Sign in**, ждём редирект с `/auth`
  на дашборд, сохраняем `storageState` в `e2e/.auth/admin.json`.
- JWT хранится во **localStorage** → `storageState` его подхватывает, все спеки
  переиспользуют сессию.
- Setup также пингует `:8000/health/` и падает с понятным сообщением,
  если бэкенд недоступен (fail-fast вместо мутных таймаутов).

Отвергнутая альтернатива: прямой `POST /api/auth/login` + ручная инъекция токена —
быстрее, но обходит реальный UI-флоу входа.

### Селекторы (из фактического кода)
- **Sign in:** `getByLabel('Email address')`, `getByLabel('Password')`,
  `getByRole('button', { name: 'Sign in' })`.
- **Create/Edit form** (`show-create-edit-form.tsx`): `getByLabel('Name')`,
  `Rank` — MUI Select (клик → `getByRole('option')`), `getByLabel('Start date')`,
  `getByLabel('City')`, submit `getByRole('button', { name: 'Create show' })` /
  `{ name: 'Save changes' }`.
- **Status/Publish** (`show-edit-view.tsx`): Select `getByLabel('Status')`,
  кнопки `getByRole('button', { name: 'Publish' })`, `Results`, `Documents`.
- **Тосты** (sonner): ассерт по тексту — `Create success!`, `Update success!`,
  `Status updated!`, `Show published!`.
- **Заголовки результатов/документов:** `Результаты — <name>`, `Документы — <name>`.

## Сценарии

Один спек `e2e/shows.spec.ts`, последовательный, единый жизненный цикл одной
свежесозданной выставки (`name = "E2E Show <timestamp>"`):

1. **Create** — `/dashboard/shows/new`: имя, первый ранг из дропдауна, `date_start`,
   submit → перехватываем `POST /api/shows`, сохраняем `id`; ассерт тоста
   `Create success!` и редиректа на список `/dashboard/shows`.
2. **Навигация из списка (регресс оригинального 404)** — на списке находим строку
   по имени, кликаем ссылку → URL `/dashboard/shows/{id}/edit`, статус 200,
   форма видна (именно этот переход ломался при повреждённом кэше).
3. **Edit** — меняем `City` → **Save changes** → тост `Update success!`.
4. **Status change** — Select `Status` → другой статус → тост `Status updated!`.
5. **Publish** — кнопка **Publish** → ждём `POST /api/shows/{id}/publish` и тост.
   Happy-path = `Show published!`; если бэк вернёт валидационную ошибку для свежего
   черновика — ассертим, что показан осмысленный **error-тост** (а не молчание).
6. **Results** — `/dashboard/shows/{id}/results`: заголовок `Результаты — <name>`,
   рендерятся панель документов и таблица результатов (пустое состояние — ок).
7. **Documents** — `/dashboard/shows/{id}/documents`: заголовок `Документы — <name>`,
   панель документов.
8. **Cleanup** — `DELETE /api/shows/{id}` через `page.request.delete` с bearer-токеном
   (токен берём из `localStorage` свежесозданной сессии), ожидаем 204. Выполняется в
   `test.afterAll`/`finally` мягко — падение cleanup не валит основные ассерты.
   UI кнопки удаления во фронте пока нет → cleanup идёт через API, не через UI.

## Обработка ошибок и edge-cases
- Бэкенд недоступен → setup падает с явным сообщением.
- Нет рангов → create невозможен; setup/тест проверяет наличие ≥1 опции и
  понятно фейлится (сейчас в БД 8 рангов).
- Publish-предусловия неизвестны → мягкий ассерт (запрос ушёл + тост появился).
- Тосты sonner авто-исчезают → использовать `toBeVisible` с разумным таймаутом
  сразу после действия.

## Что НЕ входит (YAGNI)
- Параллелизм/мультибраузерность (только chromium, последовательно).
- Другие домены (Dogs/Kennels/Litters) — отдельные спеки при необходимости.
- Глубокие флоу результатов (выставление оценок, генерация дипломов) — отдельно.
- CI-интеграция — конфиг совместим с CI, но pipeline вне scope.
- UI-удаление выставки (кнопка delete + `deleteShow` action во фронте) — возможный
  follow-up; в этом спеке DELETE используется только как cleanup через API.

## Критерии готовности
- `npx playwright test` зелёный при запущенных FE (:8082) и бэке (:8000).
- `tsc --noEmit`, `npm run lint`, `npm test` остаются зелёными.
- Спек воспроизводит и проходит навигацию list→edit (исходный 404-сценарий).
