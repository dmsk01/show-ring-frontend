# Code Review Report

**Дата:** 2026-06-11
**Проект:** Show Ring frontend (Next.js 16 App Router / MUI 7 / TypeScript — шаблон «Minimal Kit», бэкенд ShowTail FastAPI)
**Ветка:** `main`
**Тип ревью:** глубокое (deep review) — фокус на наш доменный код (auth, RBAC, API-слой, SWR-actions, секции), а не на boilerplate шаблона.

> **О шаблоне навыка.** Чек-лист `/deepreview` написан под Python-бэкенд (requirements.txt, корутины, bare `except:`, N+1 SQL). Здесь — **TypeScript/React/Next.js фронтенд**, поэтому Python/SQL-пункты помечены N/A, а вместо них применён эквивалент для TS/Next (XSS, обработка токенов, корректность async/`await`, утечки подписок, паттерны запросов, separation of concerns, покрытие тестами).
>
> **Гейты (запущены фактически):** `npx tsc --noEmit` → ✅ 0 ошибок; `npx vitest run` → ✅ **14 файлов / 97 тестов** зелёные. (`npm run lint` не перезапускался в этом проходе — см. рекомендации.)

---

## Executive Summary

Кодовая база **аккуратная и зрелая**: API-слой (`src/lib/axios.ts`) реализует корректный single-flight refresh на 401 с очередью отложенных запросов; SWR-actions единообразны, с продуманной ревалидацией и оптимистичными апдейтами (нотификации — с откатом); RBAC-движок (`src/utils/permissions.ts` + `src/config/permissions.ts`) покрыт тестами и каскадирует права; `canManageDog` явно зеркалит бэкендовскую проверку и документирует, что авторитет — бэкенд.

Главная проблема — **не в нашей бизнес-логике, а в неубранных демо-артефактах шаблона, попавших в продакшн-поток авторизации**: страница входа **публично показывает учётные данные администратора** и предзаполняет ими форму. Это самый серьёзный пункт отчёта. Кроме того, форма регистрации **собирает имя/фамилию, но не отправляет их** на бэкенд (потеря данных).

Критическая — 1, Major — 3, Minor — 6. Подробности ниже.

---

## Critical Issues 🔴

### [SECURITY] Страница входа публично раскрывает учётные данные администратора
- File: `src/auth/view/jwt/jwt-sign-in-view.tsx:51-54`, `:145-149`
- Description: форма входа предзаполнена реально выглядящими кредами и, что хуже, выводит их **видимым `Alert` каждому посетителю**:
  ```tsx
  const defaultValues = { email: 'admin@admin.com', password: 'Password123!' };
  ...
  <Alert severity="info">
    Use <strong>{defaultValues.email}</strong> with password <strong>{defaultValues.password}</strong>
  </Alert>
  ```
  Если `admin@admin.com / Password123!` — это реальный seeded-аккаунт бэкенда (а в дев-стенде ShowTail он, судя по дефолтам, именно такой), то любой, кто откроет `/auth/jwt/sign-in`, получает готовый логин администратора → полный захват платформы. Даже если в проде сид другой, публичная демонстрация формата пароля и наличие предзаполненной формы — это утечка и недопустимый UX для боевой авторизации.
- Note: это унаследовано из демо Minimal Kit, но файл уже адаптирован под ShowTail (свой `signInWithPassword`), то есть это наш продакшн-вход, а не парковочное демо. Inline-комментариев, оправдывающих показ кредов, нет.
- Suggestion: удалить `Alert` с кредами полностью; заменить `defaultValues` на пустые строки (`{ email: '', password: '' }`). Если нужен дев-автологин — спрятать за `process.env.NODE_ENV !== 'production'` и/или явным `NEXT_PUBLIC_DEV_CREDENTIALS`-флагом, который по умолчанию выключен.

---

## Major Issues 🟠

### [BUG / DATA-LOSS] Регистрация собирает имя и фамилию, но не отправляет их
- File: `src/auth/view/jwt/jwt-sign-up-view.tsx:33-41`, `:71-77` + `src/auth/context/jwt/action.ts:11`, `:27-30`
- Description: схема и форма регистрации требуют `firstName` и `lastName` (`z.string().min(1, ...)`), пользователь обязан их заполнить — но `signUp` принимает и шлёт только `{ email, password }`:
  ```ts
  export type SignUpParams = { email: string; password: string };
  export const signUp = async ({ email, password }: SignUpParams) => {
    const res = await axios.post(endpoints.auth.signUp, { email, password });
    ...
  };
  ```
  В `onSubmit` тоже передаются только `email`/`password`. Введённые имя и фамилия молча отбрасываются — пользователь регистрируется без профильного имени, хотя форма создавала ожидание обратного.
- Suggestion: либо расширить `SignUpParams`/тело запроса полями `first_name`/`last_name` (сверившись со схемой `/auth/register` в `:8000/openapi.json`), либо, если бэкенд не принимает имя при регистрации, убрать эти поля из формы и схемы, чтобы не собирать данные, которые выкидываются.

### [SECURITY] Захардкоженные демо-креды по умолчанию в форме регистрации
- File: `src/auth/view/jwt/jwt-sign-up-view.tsx:54-59`
- Description: `defaultValues = { firstName: 'Hello', lastName: 'Friend', email: 'hello@gmail.com', password: '@2Minimal' }`. Предзаполненная боевая форма регистрации — пользователь может случайно отправить демо-значения; это тот же класс демо-артефакта, что и в Critical, но без публичного показа.
- Suggestion: обнулить `defaultValues` (пустые строки), как и в форме входа.

### [SECURITY / standing] JWT (access + refresh) в `localStorage`
- File: `src/auth/context/jwt/constant.ts` (ключи), читается в `src/lib/axios.ts:27,76`, пишется в `src/auth/context/jwt/action.ts:16-17`
- Description: и access-, и refresh-токен живут в `localStorage`, доступном любому инжектнутому скрипту (XSS → кража долгоживущего refresh-токена). Это унаследованный паттерн Minimal Kit, уже отмечался в прошлом ревью (`review_report.md`, рекомендация №4) и до сих пор не закрыт на уровне архитектуры.
- Note: на текущем этапе (дев-интеграция) это осознанный trade-off; код корректно чистит оба токена при logout/refresh-fail.
- Suggestion: завести трекнутый тикет на перенос refresh-токена в httpOnly-cookie, когда бэкенд сможет это поддержать. Действий в рамках этого ревью не требуется, но риск нужно держать на радаре.

---

## Minor Issues 🟡

### [CONSISTENCY] Рассинхрон политики паролей
- File: `src/auth/view/jwt/jwt-sign-in-view.tsx:34-37`, `jwt-sign-up-view.tsx:37-40` (min 6) ↔ `src/sections/profile/profile-security-form.tsx` (`PasswordSchema` 8–128)
- Description: при регистрации/входе минимум 6 символов, а при смене пароля — 8–128. Пользователь может зарегистрироваться с 6-символьным паролем, который затем не пройдёт валидацию формы смены пароля. Бэкенд авторитетен, но клиентские правила должны быть согласованы.
- Suggestion: вынести единую `PasswordSchema` (8–128) в общий модуль и переиспользовать во всех трёх формах.

### [SCALABILITY] Список пользователей в админке обрезан на 100 без пагинации
- File: `src/actions/admin.ts:20-30`
- Description: `useGetAdminUsers` жёстко запрашивает `per_page: 100` и не имеет UI-пагинации. При >100 пользователей часть просто не видна и неуправляема (нельзя заблокировать/выдать роль). В отличие от reference-списков (`per_page: 200`), здесь нет комментария-обоснования «список маленький», и это реальный управляющий список, а не справочник.
- Suggestion: добавить серверную пагинацию (`page`/`per_page` + `TablePaginationCustom`, который уже есть в шаблоне), как сделано для Dogs/Shows/Classifieds. То же касается модерационных списков `useGetModerationClassifieds`/`useGetModerationKennels` (фетчат всё без пагинации).

### [VALIDATION/UX] Загрузка файлов без клиентской проверки типа и размера
- File: `src/actions/file.ts:16-25`
- Description: `uploadFile` шлёт любой `File` как `multipart/form-data` без предварительной проверки MIME-типа и размера. Бэкенд авторитетен, но пользователь узнаёт об отказе (например, 50-МБ файл или не-изображение) только после долгой загрузки — плохой UX и лишний трафик.
- Suggestion: добавить guard по `file.type`/`file.size` перед запросом (компоненты `Upload`/`UploadAvatar` шаблона поддерживают `accept`/`maxSize` — задавать лимиты на уровне вызова).

### [I18N] Auth-страницы захардкожены на английском
- File: `src/auth/view/jwt/jwt-sign-in-view.tsx`, `jwt-sign-up-view.tsx` (все строки: «Sign in to your account», «First name», «Password must be at least 6 characters!» и т.д.)
- Description: согласно памяти проекта (domain-i18n) все доменные секции интернационализированы и **русский — дефолт**, а формы входа/регистрации остались полностью на английском без `useTranslate`. Несогласованно для RU-first продукта; первый экран, который видит пользователь, — на чужом языке.
- Note: возможно, отложено осознанно. Если так — стоит зафиксировать это в плане i18n.
- Suggestion: прогнать auth-вью через тот же i18n-конвейер (`useTranslate`), что и домены; сообщения zod-схем тоже вынести в локали.

### [NAMING] `AuthGuard.checkPermissions` проверяет только аутентификацию
- File: `src/auth/guard/auth-guard.tsx:41-58`
- Description: функция называется `checkPermissions`, но проверяет лишь `authenticated`/`loading`; права (permissions) проверяет отдельный `PermissionGuard`. Вводит в заблуждение при чтении.
- Suggestion: переименовать в `checkAuth`/`checkSession` — чисто читаемость, нулевой риск.

### [ROBUSTNESS] `PermissionGuard` повторно дёргает `router.replace` при недоступе
- File: `src/auth/guard/permission-guard.tsx:31-43`
- Description: при `!allowed` эффект вызывает `router.replace(paths.page403)`, но `isChecking` остаётся `true` (всегда `SplashScreen`), а зависимости эффекта включают `can/canAny/canAll`. Пока они стабильны (мемоизированы в `usePermissions`), повторов нет, но при будущем изменении мемоизации возможны лишние `replace`. Сейчас работает корректно — это замечание на устойчивость.
- Suggestion: после `router.replace` делать ранний `return` и/или флажок «redirected», чтобы эффект был идемпотентен независимо от стабильности коллбэков.

---

## Positive observations ✅

- **401-refresh сделан правильно.** `src/lib/axios.ts:100-140` — single-flight refresh c очередью `pendingQueue`, `_retry`-гард от бесконечного цикла, исключение `/auth/*` (нет refresh-шторма на падающем логине), корректный `finally { isRefreshing = false }` и редирект на sign-in с сохранением `returnTo`.
- **Оптимистичные апдейты с откатом.** `src/actions/notification.ts:73-114` — мгновенный флип `is_read` в кэше, PATCH, и ревалидация-роллбэк на ошибке; идемпотентность бэкенда учтена в комментарии. Образцовый паттерн.
- **RBAC-движок чистый и тестируемый.** `src/utils/permissions.ts` — каскад `*` ⊃ `rules` ⊃ `rules:edit`, `normalizeRoles` терпим к форматам `/users/me` (`[{role}]` и голые строки), union прав по мульти-ролям; покрыт тестами в `src/config/__tests__`.
- **`canManageDog` зеркалит бэкенд и документирует авторитет.** `src/sections/dog/dog-utils.ts:20-34`: *«Авторитет — бэкенд, он перепроверяет права независимо»* — фронт-гард для UX, не для безопасности. Правильная модель доверия.
- **SWR-паттерны единообразны и документированы.** Фильтрация пустых query-параметров (`v !== '' && v !== 'all'`), консистентная ревалидация списков через предикат по ключу-массиву, осознанный сброс кэша размонтированных вьюх (`show-entry.ts:64-67` с комментарием).
- **`Accept-Language` в интерсепторе** (`axios.ts:24-33`) с fallback на `ru` до инициализации i18next — аккуратная локализация справочных данных бэкенда.
- **Гейты зелёные:** `tsc` 0 ошибок, 97 unit-тестов проходят.

---

## Post-review fixes applied ✅ (2026-06-11)

Гейты после правок: `npx tsc --noEmit` → ✅ 0; `npx eslint "src/**/*"` → ✅ 0; `npx vitest run` → ✅ **15 файлов / 102 теста** (+5: новый `src/auth/__tests__/password-policy.test.ts`).

- **🔴 [SECURITY — креды на странице входа] — исправлено.** Удалён `Alert` с логином/паролем администратора; `defaultValues` формы входа обнулены (`{ email: '', password: '' }`). `src/auth/view/jwt/jwt-sign-in-view.tsx`.
- **🟠 [BUG — потеря имени при регистрации] — исправлено.** Сверился со схемой бэкенда `UserCreate` (`app/schemas/user.py`) — `/auth/register` принимает **только** `email`+`password`. Поля `firstName`/`lastName` и их валидация убраны из формы, чтобы не собирать выбрасываемые данные. `src/auth/view/jwt/jwt-sign-up-view.tsx`.
- **🟠 [SECURITY — демо-дефолты регистрации] — исправлено.** `defaultValues` обнулены.
- **🟠 [SECURITY — JWT в localStorage] — ИСПРАВЛЕНО (миграция на httpOnly-куки, 2026-06-12).** Бэкенд перешёл на доставку токенов в httpOnly-куках по умолчанию (Secure вне debug, `SameSite=Strict`, refresh ограничен `path=/auth`, тело ответа — `null`; body-режим оставлен для будущего React Native через заголовок `X-Token-Delivery: body`). Добавлен CSRF-middleware (чужой Origin на мутациях → 403). Фронт переведён на cookie-режим:
  - `src/lib/axios.ts`: `withCredentials: true`; убрано чтение/запись токенов в `localStorage` и заголовок `Authorization` из него; refresh на 401 теперь без тела (refresh-куку шлёт браузер), очередь/ретрай — на флаге успеха, а ретрай просто переотправляет запрос со свежей access-кукой.
  - `src/auth/context/jwt/*`: `signIn`/`signOut` без хранения токенов; `signUp` больше **не** авторизует (бэкенд `/auth/register` шлёт письмо для подтверждения — ведём на `/sign-in` с уведомлением); `checkUserSession` пробует `/users/me` по куке с флагом `_skipAuthRedirect` (аноним на публичных страницах не редиректится на логин); удалены `setSession`/`constant.ts` с ключами localStorage.
  - e2e: авторизация проверяется/переносится через `access_token`-куку (`storageState`), а не localStorage.
  - **Бэкенд dev `.env` (требовалось, сделано):** `COOKIE_PATH_PREFIX=/api` (иначе refresh-кука `path=/auth` недостижима через `/api`-прокси) и `CORS_ALLOW_ORIGINS=[...,"http://localhost:8082"]` (CSRF-middleware сверяет Origin со списком; dev-порт Next — 8082, не Vite-шный 5173).
  - **✅ Проверено в рантайме (2026-06-12, `scripts/cookie-smoke.mjs`, реальный Chromium):** логин → 200/редирект в дашборд; куки `access_token path=/api`, `refresh_token path=/api/auth` (httpOnly, SameSite=Strict); принудительный refresh (удалили access, оставили refresh) → `POST /api/auth/refresh` 200, выдан новый access, `/users/me` 200, на логин НЕ выкинуло. Токенов в localStorage нет.
- **🟡 [Политика паролей] — исправлено (единый источник).** Создан `src/auth/password-policy.ts` — зеркало бэкендовского `validate_password` (8–128 символов **и ≤72 байта UTF-8**, ограничение bcrypt). Используется в регистрации и в смене пароля (`profile-security-form.tsx`); вход требует лишь непустой пароль (аутентификация легаси-учёток). Покрыт unit-тестом.
- **🟡 [Пагинация админки] — исправлено в рамках возможностей бэкенда.** `/admin/users` и модерационные очереди возвращают голый массив без `total` (page/per_page до 200). Поднял `per_page` до максимума бэкенда (200) с комментарием и TODO на настоящую server-side пагинацию, когда бэкенд начнёт отдавать `total`. Заодно ключи SWR переведены на `[url,{params}]` и согласованы с предикатными `mutate`. `src/actions/admin.ts`.
- **🟡 [Валидация загрузок] — исправлено.** Загрузка фото собаки ограничена изображениями (`accept={{ 'image/*': [] }}`) в дополнение к существующему `maxSize`. `src/sections/dog/dog-create-edit-form.tsx`. (Загрузка объявлений уже фильтровала `image/*`.)
- **🟡 [i18n auth-страниц] — исправлено.** Созданы `src/locales/langs/{en,ru}/auth.json`; формы входа/регистрации переведены на `useTranslate(['auth'])` (RU-дефолт). Сообщения zod вынесены в локали. e2e-сетап (`e2e/auth.setup.ts`) переведён на локаль-независимые селекторы (`input[name=...]`, `button[type=submit]`).
- **🟡 [Нейминг AuthGuard] — исправлено.** `checkPermissions` → `checkAuth` с комментарием о разделении ответственности с `PermissionGuard`.
- **🟡 [PermissionGuard повторный replace] — исправлено.** Добавлен `useRef`-гард идемпотентности редиректа на `/403`.

## Recommendations

1. **(Critical) Немедленно убрать публичный показ и предзаполнение кредов администратора** на странице входа — до любого не-локального деплоя. Дев-автологин, если нужен, — за env-флагом, выключенным по умолчанию.
2. **(Major) Починить регистрацию:** либо отправлять `first_name`/`last_name` на бэкенд (сверить со схемой `/auth/register`), либо убрать эти поля из формы.
3. **(Major) Обнулить `defaultValues`** во всех боевых auth-формах.
4. **Единая `PasswordSchema`** (8–128) для входа/регистрации/смены пароля.
5. **Серверная пагинация** для списка пользователей админки и модерационных списков.
6. **Клиентская валидация загрузок** (тип/размер) до отправки.
7. **Прогнать auth-вью через i18n** (RU-first) — согласовать с остальным приложением.
8. **(Standing) Тикет на httpOnly-cookie** для refresh-токена.
9. Перезапустить `npm run lint` перед коммитом (в этом проходе гонялись только `tsc` и `vitest`).

---

### Покрытие чек-листа (для прозрачности)

| Область шаблона | Результат |
|---|---|
| Injection (SQL/command/path traversal) | N/A — фронтенд, нет SQL/shell/fs. Бэкенд авторитетен. |
| Hardcoded secrets/tokens | 🔴 Демо-креды администратора показаны публично + предзаполнены (sign-in/sign-up). Боевых API-секретов в коде нет — все из env/рантайма. |
| Input validation / sanitization | 🟡 Рассинхрон политики паролей; нет клиентской проверки загрузок; XSS через `dangerouslySetInnerHTML` — **не найдено** (0 совпадений в `src/sections`). |
| Insecure/unpinned deps | ✅ Версии из `package.json` (next ^16.2.4, react ^19.2.0, MUI 7.3.2, zod 4.x, swr ^2.3.4). Новых зависимостей не вносилось. |
| Sensitive data in logs/responses | 🟡 `console.error(error)` в auth-хендлерах логирует уже сжатый `Error(detail)` — низкий риск, паттерн шаблона. |
| Missing `await` / async correctness | ✅ Все промисы дождаются (`signUp`/`signInWithPassword`/`checkUserSession`/`mutate`). Висячих промисов в проверенных хендлерах нет. |
| Mutable shared state (TS-аналог mutable default args) | ✅ `pendingQueue`/`isRefreshing` в axios — намеренное модульное состояние, корректно сбрасывается. |
| Unclosed resources / listeners | ✅ Подписок/таймеров вручную не заводится; `refreshInterval: 60_000` управляется SWR (чистится при unmount). |
| Circular imports / separation of concerns | ✅ Слои actions ↔ views ↔ auth-context чистые; циклов не обнаружено. |
| N+1 / caching | ✅ SWR-кэш и `revalidateIfStale:false` намеренно избегают лишних рефетчей. |
| Testing — critical paths / error branches | 🟡 RBAC/схемы/утилиты покрыты (97 тестов); auth `signUp`-дроп полей и пагинация админки — без тестов. |
