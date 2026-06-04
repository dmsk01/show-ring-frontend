# Интеграция account-security API (смена email/пароля) — дизайн

Дата: 2026-06-04

## Контекст

Бэкенд ShowTail (Этап 19) изменил контракт безопасности аккаунта. Фронт должен
учесть новое поведение в интерфейсе. Затрагивается экран `/dashboard/profile/security`
(`src/sections/profile/profile-security-form.tsx`), который сейчас умеет только менять
email и показывает заглушку «смена пароля недоступна».

### Контракт бэкенда (сверено по `E:\Coding\python-animal-platform`)

- **`PUT /users/me`** (`change_user_info`) — запрос смены email. Тело `UserUpdate`:
  `{ email, current_password }`. Rate-limit 5/час. Email **не меняется сразу** —
  пишется в `pending_email`, на новый адрес уходит письмо со ссылкой
  `{frontend_base_url}/confirm-email-change?token=...`. Ответ: `{ "message": "Проверьте
  новый email для подтверждения смены" }`. Если email тот же/не передан — возвращает юзера.
- **`POST /auth/confirm-email-change`** (`confirm_email_change_endpoint`). Тело
  `EmailChangeConfirm`: `{ token }`. Переносит `pending_email → email`, помечает email
  подтверждённым, **отзывает все refresh-токены**. Ответ: `{ "message": "Email изменён" }`.
- **`PUT /users/me/password`** (`change_user_password`). Тело `PasswordChange`:
  `{ current_password, new_password }`. Rate-limit 5/час. После смены отзывает все
  refresh-токены, шлёт уведомление. Ответ: `{ "message": "Пароль изменён" }`.
  Политика пароля: 8–128 символов (`validate_password`).
- **Коды ошибок** (FastAPI `detail`, строка): `current_password_invalid` (403),
  `email_taken` (409), `password_same_as_current` (400), `invalid_or_expired_token` (400).
  axios-интерсептор (`src/lib/axios.ts`) уже сводит ответ к `Error(detail)`, поэтому
  `error.message` === код.

## Объём

Полностью все три части + маппинг ошибок (подтверждено пользователем).

## Переиспользуемые компоненты шаблона (Minimal Kit)

- `FormHead`, `FormReturnLink` — `src/auth/components`
- `EmailInboxIcon`, `NewPasswordIcon` — `src/assets/icons`
- `AuthCenteredLayout` — `src/layouts/auth-centered`
- `Form`, `Field.Text` — `src/components/hook-form`; паттерн show/hide пароля из
  `src/sections/account/account-change-password.tsx`
- `signOut` — `src/auth/context/jwt/action.ts` (best-effort logout + очистка токенов)
- `getErrorMessage` — `src/auth/utils/error-message.ts`
- `toast` — `src/components/snackbar`

## Изменения

### 1. `src/lib/axios.ts` — endpoints
Добавить в `endpoints.auth`:
- `password: '/users/me/password'`
- `confirmEmailChange: '/auth/confirm-email-change'`

### 2. `src/actions/account.ts`
- `updateMyEmail(payload): Promise<{ message: string }>` — вернуть `res.data`,
  **убрать** `mutate(endpoints.auth.me)` (email сразу не меняется).
- `updateMyPassword(payload: { current_password: string; new_password: string }):
  Promise<{ message: string }>` → `PUT endpoints.auth.password`.
- `confirmEmailChange(token: string): Promise<{ message: string }>` →
  `POST endpoints.auth.confirmEmailChange` с `{ token }`.
- `accountErrorMessage(error: unknown): string` — мап кодов в RU:
  - `current_password_invalid` → «Неверный текущий пароль»
  - `email_taken` → «Этот email уже занят»
  - `password_same_as_current` → «Новый пароль совпадает с текущим»
  - `invalid_or_expired_token` → «Ссылка недействительна или устарела»
  - иначе → `getErrorMessage(error)`

### 3. `src/sections/profile/profile-security-form.tsx`
Две карточки в `Stack` (mobile-first).
- **Смена email**: убрать заглушку про пароль. На успехе `toast.success(res.message)` +
  `reset()`, **без** `checkUserSession`. Ошибки → `toast.error(accountErrorMessage(e))`.
- **Смена пароля** (новая карточка): zod-схема — `current_password` обязателен;
  `new_password` 8–128; `confirm_password` совпадает с `new_password`;
  `new_password !== current_password`. show/hide через `useBoolean` + `Iconify`. На успехе
  `toast.success(res.message)` + `reset()`. Ошибки → `accountErrorMessage`.

### 4. Страница `/confirm-email-change`
- `src/app/confirm-email-change/page.tsx` — рендерит view, `metadata.title`.
- `src/app/confirm-email-change/layout.tsx` — обёртка `AuthCenteredLayout` **без**
  `GuestGuard` (по ссылке приходит и залогиненный, и гость).
- `src/auth/view/confirm-email-change-view.tsx`:
  - Читает `token` из query (`useSearchParams`).
  - **По кнопке** «Подтвердить смену email» (не авто — токен одноразовый, защита от
    пре-фетч сканеров почты) вызывает `confirmEmailChange(token)`.
  - Состояния:
    - нет токена → ошибка «Ссылка недействительна или устарела» + `FormReturnLink` на sign-in.
    - idle → `FormHead` (`EmailInboxIcon`) + кнопка подтверждения.
    - успех → `signOut()` (бэк отозвал refresh) → `FormHead` (галка) «Email изменён, войдите
      заново» + кнопка на sign-in.
    - ошибка → сообщение из `accountErrorMessage` + `FormReturnLink`, кнопка снова активна.

## Обработка ошибок

Все пользовательские ошибки — через `accountErrorMessage`. 422 (слабый пароль) не ожидается:
клиентский zod держит длину 8–128. Fallback — `getErrorMessage`.

## Тестирование

- `accountErrorMessage` — юнит-тест (vitest): известные коды → RU, неизвестное → fallback.
- Гейты: `npx tsc --noEmit` (0), `npx eslint --fix` затронутых файлов (0), `npm test` (зелёно).

## Вне объёма

- i18n EN-перевод новых строк (RU-хардкод в духе текущего `profile-security-form.tsx`).
- Резенд письма подтверждения смены email.
