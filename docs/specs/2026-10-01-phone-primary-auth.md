# Телефон — основной способ входа и регистрации (фронтенд)

Полная спека (анализ as-is, варианты, риски, тикеты, самопроверка) — в бэкенде:
`show-ring-backend/docs/superpowers/specs/2026-10-01-phone-primary-auth-design.md`.

## Что сделано на фронте (FE-1…FE-8)

| Тикет | Где |
|---|---|
| FE-1 API-слой, реестр методов | `src/lib/axios.ts` (`endpoints.auth.*`), `src/auth/context/jwt/action.ts` (`sendPhoneCode`, `verifyPhoneCode`), `src/actions/account.ts` (привязка телефона, re-auth, подключение почты, `IMe`), `src/auth/hooks/use-auth-methods.ts` |
| FE-2 Телефон: схемы, ошибки | `src/auth/phone.ts` + `src/auth/__tests__/phone.test.ts` |
| FE-3 Форма OTP | `src/auth/components/phone-otp-form.tsx` (номер → код, повтор с таймером, «изменить номер») |
| FE-4 Вход | `src/auth/view/jwt/jwt-sign-in-view.tsx`: по умолчанию телефон, «Войти по почте» — дополнительно, `?method=email` — deep-link |
| FE-5 Регистрация | `src/auth/view/jwt/jwt-sign-up-view.tsx`: только телефон |
| FE-6 Профиль → Безопасность | `src/sections/profile/profile-sign-in-methods.tsx` (`PhoneCard`, `EmailLoginCard`), `profile-security-form.tsx` |
| FE-7 Баннер, отображение | `src/layouts/components/phone-required-banner.tsx`, `getUserDisplay` (fallback на телефон), приветствие нового пользователя в `profile-view.tsx` |
| FE-8 i18n, e2e | `src/locales/langs/{ru,en}/{auth,profile}.json`, `e2e/auth.setup.ts`, `e2e/auth.spec.ts`, `e2e/classifieds.spec.ts` |

## Поведение

- Новый номер на экране **входа** тоже создаёт аккаунт (find-or-create на бэкенде), поэтому под формой — согласие с условиями и подсказка для тех, кто регистрировался по почте.
- После первого входа нового пользователя — полная навигация в `/dashboard/profile?welcome=sign-up|sign-in` (или на `returnTo`, если он был).
- Ошибки OTP на `/users/me/*` приходят как 400 — axios-интерсептор не принимает их за протухшую сессию.
