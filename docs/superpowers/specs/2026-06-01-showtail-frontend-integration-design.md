# Дизайн: интеграция фронтенда ShowTail (фундамент + срез Dogs)

**Дата:** 2026-06-01
**Статус:** утверждён к реализации
**Охват этой спеки:** слой-фундамент (подключение, авторизация, refresh, RBAC) + первый вертикальный срез **Dogs**. Остальные домены — отдельными спеками по тому же рецепту.

---

## 1. Контекст

- **Фронтенд:** `show-ring-frontend` — Minimal Kit (Next.js 16, App Router, MUI 7, TypeScript). Dev-порт **8082** (`next dev --turbopack`). Сейчас это чистый шаблон с демо-страницами; доменов ShowTail нет.
- **Бэкенд:** ShowTail (`E:\Coding\python-animal-platform`) — FastAPI, ~120 эндпоинтов, 18 доменов. Swagger: http://localhost:8000/docs.
- **Цель:** связать фронт с реальным API и реализовать первый домен (Dogs) как эталонный паттерн, который повторяется на остальных доменах.

### Подтверждённые факты из живого API (через OpenAPI + запросы)

- `POST /auth/login` и `POST /auth/register` принимают `{ email, password }`, возвращают `TokenResponse = { access_token, refresh_token, token_type }` (snake_case, два токена).
- Access-токен живёт **15 мин**, refresh — **7 дней**. `POST /auth/refresh` принимает `{ refresh_token }`. Refresh-флоу обязателен.
- `GET /users/me` → `{ id, email, is_active, is_email_verified, roles: [{ role, granted_at }], created_at }`. **`roles` — массив объектов** (мульти-роль).
- `GET /users/me/profile` → `{ first_name, last_name, patronymic, country }` (имя пользователя живёт здесь, не в `/users/me`).
- Роли (`RoleEnum`): `admin, organizer, breeder, judge, buyer, operator`.
- Rate limit: `POST /auth/login` — 5/мин на IP, `register` — 3/час. Учитывать при ручном тестировании.

---

## 2. Слой-фундамент

Строится один раз, до любого домена.

### 2.1 Подключение — Next.js rewrites
В `next.config.ts` добавить:
```ts
async rewrites() {
  return [
    { source: '/api/:path*', destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/:path*` },
  ];
}
```
- axios `baseURL = '/api'` (через `NEXT_PUBLIC_SERVER_URL=/api`).
- Один origin → CORS не нужен, бэкенд не трогаем.

### 2.2 Авторизация — переписать `src/auth/context/jwt/`
- `endpoints.auth` в `src/lib/axios.ts`: `login: '/auth/login'`, `register: '/auth/register'`, `refresh: '/auth/refresh'`, `me: '/users/me'`.
- `action.ts`: маппинг `access_token`/`refresh_token` → хранить **оба** токена (access — в памяти/sessionStorage, refresh — для обновления). Ключи в `constant.ts`.
- **Request-интерцептор** в axios: подставлять `Authorization: Bearer <access_token>` в каждый запрос (сейчас закомментировано и работает только через `axios.defaults`, что ломается после refresh).
- **Response-интерцептор**: на `401` — один раз дёрнуть `POST /auth/refresh`, повторить исходный запрос; при неудаче — `signOut()`. Защита от бесконечного цикла (флаг `_retry`, очередь одновременных запросов).
- `auth-provider.tsx`: `checkUserSession` читает `/users/me`; пользователь собирается из `/users/me` + (опционально) `/users/me/profile` для отображаемого имени.

### 2.3 RBAC под реальные роли — `src/config/permissions.ts`
- Заменить `ROLES_LIST = ['admin','user']` на 6 ролей бэкенда. `DEFAULT_ROLE` — наименее привилегированная (`buyer`).
- `ROLE_PERMISSIONS`: матрица «роль → права». `admin: ['*']`. Остальные — по доменам (например `breeder: ['dogs', 'kennels', 'litters', 'classifieds']`, `organizer: ['shows', ...]`, `judge: ['shows:results', ...]`). Стартовая матрица в спеке плана; уточняется по мере добавления доменов.
- **Мульти-роль:** `roles[]` из `/users/me` → объединять (union) права по всем `roles[].role`. Адаптировать `normalizeRole`/провайдер: вместо одной роли — массив ролей, итоговые permissions = union.
- Движок `src/utils/permissions.ts` (`can/canAny/canAll`, `*` и каскад `resource` → `resource:action`) остаётся без изменений.
- Типы в `src/types/permissions.ts` обновить под 6 ролей.

### 2.4 `.env` (уже в `.gitignore`)
```
NEXT_PUBLIC_SERVER_URL=/api
BACKEND_URL=http://localhost:8000
# dev-админ (bootstrap_admin), для справки/тестов
DEV_ADMIN_EMAIL=admin@admin.com
DEV_ADMIN_PASSWORD=Password123!
```

---

## 3. Вертикальный срез Dogs (эталонный паттерн)

Доказывает сквозной паттерн, который копируют все последующие домены.

### 3.1 Типы — `src/types/dog.ts`
Из подтверждённой схемы:
- `sex: 'male' | 'female'` (`SexEnum`).
- Обязательные при создании: `name`, `sex`, `breed_id`.
- Остальные: `kennel_id, date_of_birth, color, rkf_number, tattoo, microchip, father_id, mother_id, description`.
- `DogResponse` дополнительно: `id, created_at, updated_at`.
- `DogPage = { items: DogResponse[], total, page, per_page }`.
- `DogTitle`, `DogPedigree` — по схемам `/dogs/{id}/titles`, `/dogs/{id}/pedigree`.

### 3.2 Слой данных — `src/actions/dog.ts` (SWR, как принято в Minimal Kit)
- `useGetDogs(filters)` — фильтры `breed_id, kennel_id, sex, search, page, per_page` → `DogPage`.
- `useGetDog(id)`, `useGetDogPedigree(id)`, `useGetDogTitles(id)`.
- Мутации: `createDog(data)` (`POST /dogs`), `updateDog(id, data)` (`PUT /dogs/{id}`) + `mutate` инвалидация.

### 3.3 UI — `src/sections/dog/` (копия паттерна `src/sections/user/`)
- `dog-table-row.tsx`, `dog-table-toolbar.tsx`, `dog-table-filters-result.tsx`.
- `dog-create-edit-form.tsx` — `react-hook-form` + `zod` (`zod` и `@hookform/resolvers` уже в зависимостях).
- `view/`: `dog-list-view.tsx`, `dog-create-view.tsx`, `dog-edit-view.tsx`, `dog-detail-view.tsx` (вкладки: инфо / родословная / титулы).
- `breed_id`/`kennel_id`/`father_id`/`mother_id` — автокомплиты, подтягивающие справочники (`/references/breeds`) и связанные сущности.

### 3.4 Роуты и навигация
- `src/app/dashboard/dogs/`: `page.tsx` (список), `new/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`.
- `paths.dashboard.dogs.*` в `src/routes/paths.ts`.
- Пункт меню в конфиге навигации дашборда.

### 3.5 RBAC-гейтинг
- `breeder` и `admin` — создание/редактирование; остальные — только чтение.
- Гейтинг через матрицу прав + существующие guard-компоненты/хуки.

---

## 4. Стратегия по демо-страницам Minimal Kit

Переиспользуем вдумчиво, **ничего не удаляем в рамках этой спеки** — ведём инвентаризацию.

- **Оставить и переиспользовать:** `dashboard/analytics` (→ админ-аналитика), вся библиотека `src/components`, паттерн CRUD `user` (шаблон каждого домена), auth-вьюхи, лейауты/навигация.
- **Припарковать (пригодится позже):** `chat`/`calendar`/`kanban` (поддержка/расписание выставок), `file-manager` (файлы MinIO), `mail`.
- **Кандидаты на удаление (отдельной задачей позже):** `ecommerce`, `banking`, `booking`, `course`, `tour`, `job`, `post/blog`, showcase-роуты `components/*`.

Инвентаризация «оставить / припарковать / удалить» ведётся в плане; физическая чистка — отдельная задача после нескольких доменов.

---

## 5. Повторяемый рецепт для следующих доменов

После Dogs каждый домен (`references → kennels → litters → classifieds → shows → results → ads → support → admin`) проходит 5 шагов: **типы → SWR-actions → секции (копия ближайшего паттерна) → роуты/навигация → RBAC**. Каждый домен — отдельная спека+план под свой объём. Эта спека покрывает только **фундамент + Dogs**.

---

## 6. Верификация

- **После фундамента:** в запущенном приложении (8082 + бэкенд 8000) залогиниться админом `admin@admin.com` / `Password123!`, убедиться, что работают логин, refresh, `/users/me`, RBAC (union прав по `roles[]`).
- **После Dogs:** полный CRUD против живого бэкенда — создать собаку, список с фильтрами, редактирование, просмотр карточки с родословной и титулами; проверки RBAC (breeder может редактировать, buyer — нет).

---

## 7. Вне охвата (YAGNI)

WebSocket-чат поддержки, anti-fraud рекламы, UI генерации PDF, SSR/SEO-тюнинг, i18n новых доменов, автоматические e2e-тесты — откладываются на соответствующие домены/позже.
