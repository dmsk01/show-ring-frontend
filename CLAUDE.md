# CLAUDE.md — Show Ring frontend

## Твоя роль и стандарт качества
- Действуй как **senior frontend инженер + QA**: чистый, читаемый, типобезопасный код; продумывай edge-cases, состояния загрузки/ошибок, доступность и адаптив (mobile-first).
- **Все проверки обязаны проходить без ошибок** перед коммитом:
  - `npx tsc --noEmit` → 0 ошибок
  - `npm run lint` → 0 ошибок (импорты сортируются плагином `perfectionist` — гони `npx eslint --fix <files>`)
  - `npm test` → зелёно (vitest, юнит-тесты чистой логики)
- Не коммить и не считай задачу готовой, пока гейты не зелёные. Проверяй фактическим запуском, не на словах.

## Это ШАБЛОН — переиспользуй готовые UI-компоненты (ОБЯЗАТЕЛЬНО)
Проект построен на **Minimal Kit** (Next.js 16 App Router, MUI 7, TypeScript) — это **готовая админка из сотен компонентов и целых страниц**. Почти всё нужное уже есть.

**ПРАВИЛО (жёсткое):** прежде чем писать ЛЮБОЙ компонент/страницу/секцию — сначала **исследуй шаблон** (`src/sections/**`, `src/sections/_examples/**`, `src/components/**`, демо в `src/app/**`) и **переиспользуй готовое**. Свой компонент пишем **только если после исследования ничего подходящего нет**, и тогда строим из примитивов шаблона, а не с нуля. Перед версткой потрать ход на поиск (Glob/Grep) и назови, что переиспользуешь. Не плоди аналоги существующему.

**Ориентиры готовых страниц:** профиль пользователя `/dashboard/user` (`src/sections/user/view/user-profile-view.tsx`: `ProfileCover` — обложка+аватар, `ProfileHome` — About/social); управление пользователями `/dashboard/user/list`; аккаунт `/dashboard/user/account`; продукты/инвойсы/заказы — полные CRUD.

Кирпичи для переиспользования:
- Формы: `src/components/hook-form` — `Form`, `Field.*` (`Field.Text/Select/Autocomplete/UploadAvatar/Phone/CountrySelect` и т.д.) поверх `react-hook-form` + `zod`.
- Таблицы: `src/components/table` — `useTable`, `TableHeadCustom`, `TableNoData`, `TablePaginationCustom`, `TableHeadCellProps`.
- Загрузки: `src/components/upload` — `UploadAvatar`, `Upload`, `UploadBox` (drag&drop, превью). НЕ делай кастомные `<input type=file>`.
- Прочее: `Iconify`, `Label`, `Scrollbar`, `CustomBreadcrumbs`, `CustomPopover`, `ConfirmDialog`, `carousel`, `animate` (`varFade`, `MotionViewport`, `AnimateCountUp`), `filters-result`.
- Иконки `Iconify` типизированы реестром `src/components/iconify/icon-sets.ts` — использовать можно только **зарегистрированные** имена (иначе `tsc` упадёт). Нужную иконку добавляй в реестр или бери уже зарегистрированную.
- Паттерны доменов копируй с готовых срезов: **`src/sections/dog`, `src/sections/kennel`, `src/sections/litter`** (и демо `src/sections/user`).

## Архитектура и бэкенд
- Бэкенд **ShowTail** (FastAPI) на `http://localhost:8000`, репозиторий `E:\Coding\python-animal-platform`. Swagger: `:8000/docs`, OpenAPI: `:8000/openapi.json` (сверяйся со схемами перед реализацией).
- Фронт ходит на `/api/*` → прокси в бэкенд через `next.config.ts` `rewrites()` (`skipTrailingSlashRedirect: true`). axios `baseURL='/api'` (`src/lib/axios.ts`), bearer + single-flight 401-refresh.
- Auth: JWT (`/auth/login`, `/users/me`, `/auth/refresh`, `/auth/logout` — logout требует `{refresh_token}` в теле). RBAC: 6 ролей (`admin, organizer, breeder, judge, buyer, operator`), мульти-роль (union прав). Конфиг прав — `src/config/permissions.ts`, движок — `src/utils/permissions.ts`, гард — `PermissionGuard` из `src/auth/guard`.
- Файлы: `uploadFile`/`fileUrl` в `src/actions/file.ts`; `GET /api/files/{id}` публичный (работает в `<img>`).
- Локали: только **RU + EN** (`src/locales`); лендинг — самодостаточный словарь `src/sections/landing/content`.

## Рецепт нового домена (как делали Dogs/Kennels/Litters)
`types (src/types) → SWR-actions (src/actions, паттерн product.ts/dog.ts) → секции (src/sections, копия dog/kennel) → роуты App Router (src/app/dashboard) + пункт в src/layouts/nav-config-dashboard.tsx + paths в src/routes/paths.ts → RBAC-гард на страницах`. Динамические страницы Next 16: `params: Promise<{id}>`, `await params`.

## Документация проекта
- Roadmap дальнейшей работы: `docs/plans/2026-06-01-frontend-roadmap.md`.
- Спеки/планы: `docs/superpowers/specs/`, `docs/superpowers/plans/` (интеграция бэкенда + Dogs, лендинг).

## Полезное / известные нюансы
- `tsconfig.json`: без `baseUrl`; алиасы через `paths` (`src/*`). 
- `npm run build` сейчас падает только на **демо**-странице `/dashboard/post/[title]` (SSR-fetch демо против относительного `/api`) — это припаркованное демо Minimal, не наш код; чистка демо — отдельная задача.
- Бэкенд (docker-стек) бывает недоступен/инициализируется — рантайм-проверки делай, когда `:8000/health/` отвечает 200; код всегда верифицируй оффлайн (tsc/lint/test).
- Пагинация бэка неоднородна: Dogs/Litters — плоско `{items,total,page,per_page}`; References/Breeds — `{items, meta:{total,page,per_page}}`; **Kennels (`GET /kennels`) — голый массив `KennelResponse[]` без обёртки и без total** (нормализуй через `normalizeKennelsResponse` в `src/actions/kennel.ts`). Всегда сверяйся со схемой.
- Коммиты — осмысленными инкрементами; в конце сообщения коммита: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
