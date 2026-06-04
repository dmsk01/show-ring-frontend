# Account-security API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести фронт в соответствие с новым контрактом account-security бэкенда: смена email через подтверждение (`pending_email`), смена пароля, страница `/confirm-email-change`, маппинг кодов ошибок в RU.

**Architecture:** SWR-actions в `src/actions/account.ts` дополняются методами пароля и подтверждения email; чистый маппер ошибок выносится в `src/actions/account-errors.ts` (юнит-тест). Экран `/dashboard/profile/security` (`profile-security-form.tsx`) переписывается на две карточки (email + пароль). Новая standalone-страница `/confirm-email-change` собирается из готовых auth-компонентов шаблона (`FormHead`, `FormReturnLink`, `AuthCenteredLayout`).

**Tech Stack:** Next.js 16 App Router, React, MUI 7, react-hook-form + zod, SWR, axios, vitest.

---

## File Structure

- **Modify** `src/lib/axios.ts` — два новых endpoint'а в `endpoints.auth`.
- **Modify** `src/actions/account.ts` — `updateMyEmail` (новый контракт), `updateMyPassword`, `confirmEmailChange`, типы.
- **Create** `src/actions/account-errors.ts` — чистый маппер `accountErrorMessage`.
- **Create** `src/actions/__tests__/account-errors.test.ts` — юнит-тест маппера.
- **Modify** `src/sections/profile/profile-security-form.tsx` — две карточки (email + пароль).
- **Create** `src/auth/view/confirm-email-change-view.tsx` — view страницы подтверждения.
- **Create** `src/app/confirm-email-change/layout.tsx` — обёртка `AuthCenteredLayout`.
- **Create** `src/app/confirm-email-change/page.tsx` — рендер view + metadata.

---

## Task 1: endpoints + actions + маппер ошибок (TDD на маппере)

**Files:**
- Modify: `src/lib/axios.ts` (блок `endpoints.auth`, ~152-159)
- Modify: `src/actions/account.ts` (типы ~61-69 и функции)
- Create: `src/actions/account-errors.ts`
- Test: `src/actions/__tests__/account-errors.test.ts`

- [ ] **Step 1: Написать падающий тест маппера**

Создать `src/actions/__tests__/account-errors.test.ts`:

```ts
import { it, expect, describe } from 'vitest';

import { accountErrorMessage } from '../account-errors';

describe('accountErrorMessage', () => {
  it('maps known backend codes to RU messages', () => {
    expect(accountErrorMessage(new Error('current_password_invalid'))).toBe(
      'Неверный текущий пароль'
    );
    expect(accountErrorMessage(new Error('email_taken'))).toBe('Этот email уже занят');
    expect(accountErrorMessage(new Error('password_same_as_current'))).toBe(
      'Новый пароль совпадает с текущим'
    );
    expect(accountErrorMessage(new Error('invalid_or_expired_token'))).toBe(
      'Ссылка недействительна или устарела'
    );
  });

  it('falls back to the raw message for unknown codes', () => {
    expect(accountErrorMessage(new Error('Сервис недоступен'))).toBe('Сервис недоступен');
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/actions/__tests__/account-errors.test.ts`
Expected: FAIL — `Failed to resolve import "../account-errors"`.

- [ ] **Step 3: Создать маппер `src/actions/account-errors.ts`**

```ts
import { getErrorMessage } from 'src/auth/utils/error-message';

// ----------------------------------------------------------------------
// Бэкенд (Этап 19) отдаёт машиночитаемый код в FastAPI `detail`; axios-
// интерсептор (src/lib/axios.ts) сводит ответ к Error(detail), поэтому
// error.message === код. Переводим известные коды в RU; иначе — как есть.

const ACCOUNT_ERROR_MESSAGES: Record<string, string> = {
  current_password_invalid: 'Неверный текущий пароль',
  email_taken: 'Этот email уже занят',
  password_same_as_current: 'Новый пароль совпадает с текущим',
  invalid_or_expired_token: 'Ссылка недействительна или устарела',
};

export function accountErrorMessage(error: unknown): string {
  const raw = getErrorMessage(error);
  return ACCOUNT_ERROR_MESSAGES[raw] ?? raw;
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/actions/__tests__/account-errors.test.ts`
Expected: PASS (5 assertions, 2 теста).

- [ ] **Step 5: Добавить endpoints в `src/lib/axios.ts`**

Заменить блок `auth` (строки ~152-159) на:

```ts
  auth: {
    me: '/users/me',
    profile: '/users/me/profile',
    password: '/users/me/password',
    signIn: '/auth/login',
    signUp: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    confirmEmailChange: '/auth/confirm-email-change',
  },
```

- [ ] **Step 6: Обновить actions в `src/actions/account.ts`**

Заменить блок типов и `updateMyEmail` (строки ~61-69) на:

```ts
export type IUserEmailUpdate = {
  email: string;
  current_password: string;
};

export type IUserPasswordUpdate = {
  current_password: string;
  new_password: string;
};

export type IMessageResponse = { message: string };

// PUT /users/me — запрос смены email. Email НЕ меняется сразу: бэкенд пишет
// pending_email и шлёт письмо. Поэтому me НЕ мутируем — текущий email прежний.
export async function updateMyEmail(payload: IUserEmailUpdate): Promise<IMessageResponse> {
  const res = await axios.put<IMessageResponse>(endpoints.auth.me, payload);
  return res.data;
}

// PUT /users/me/password — смена пароля (re-auth текущим паролем). Бэкенд
// отзывает все refresh-токены.
export async function updateMyPassword(
  payload: IUserPasswordUpdate
): Promise<IMessageResponse> {
  const res = await axios.put<IMessageResponse>(endpoints.auth.password, payload);
  return res.data;
}

// POST /auth/confirm-email-change — подтверждение смены email по токену из
// письма: pending_email → email, отзыв refresh-токенов.
export async function confirmEmailChange(token: string): Promise<IMessageResponse> {
  const res = await axios.post<IMessageResponse>(endpoints.auth.confirmEmailChange, { token });
  return res.data;
}
```

(Импорт `mutate` в файле остаётся — его использует `updateMyProfile`.)

- [ ] **Step 7: Гейты — tsc + lint**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

Run: `npx eslint --fix src/lib/axios.ts src/actions/account.ts src/actions/account-errors.ts src/actions/__tests__/account-errors.test.ts; npx eslint src/lib/axios.ts src/actions/account.ts src/actions/account-errors.ts src/actions/__tests__/account-errors.test.ts`
Expected: 0 ошибок.

- [ ] **Step 8: Commit**

```bash
git add src/lib/axios.ts src/actions/account.ts src/actions/account-errors.ts src/actions/__tests__/account-errors.test.ts
git commit -m "feat(account): email/password change actions + RU error mapper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: экран безопасности — две карточки (email + пароль)

**Files:**
- Modify (полная замена): `src/sections/profile/profile-security-form.tsx`

- [ ] **Step 1: Переписать `src/sections/profile/profile-security-form.tsx`**

```tsx
'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { updateMyEmail, updateMyPassword } from 'src/actions/account';
import { accountErrorMessage } from 'src/actions/account-errors';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type EmailSchemaType = z.infer<typeof EmailSchema>;

export const EmailSchema = z.object({
  email: z
    .string()
    .min(1, { error: 'Введите email' })
    .refine((v) => /.+@.+\..+/.test(v), { error: 'Некорректный email' }),
  current_password: z.string().min(1, { error: 'Введите текущий пароль' }),
});

export type PasswordSchemaType = z.infer<typeof PasswordSchema>;

export const PasswordSchema = z
  .object({
    current_password: z.string().min(1, { error: 'Введите текущий пароль' }),
    new_password: z
      .string()
      .min(8, { error: 'Минимум 8 символов' })
      .max(128, { error: 'Максимум 128 символов' }),
    confirm_password: z.string().min(1, { error: 'Подтвердите новый пароль' }),
  })
  .refine((val) => val.new_password === val.confirm_password, {
    error: 'Пароли не совпадают',
    path: ['confirm_password'],
  })
  .refine((val) => val.new_password !== val.current_password, {
    error: 'Новый пароль совпадает с текущим',
    path: ['new_password'],
  });

const EMAIL_CHANGE_FALLBACK = 'Проверьте новый email для подтверждения смены';

// ----------------------------------------------------------------------

export function ProfileSecurityForm() {
  return (
    <Stack spacing={3}>
      <EmailCard />
      <PasswordCard />
    </Stack>
  );
}

// ----------------------------------------------------------------------

function EmailCard() {
  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(EmailSchema),
    defaultValues: { email: '', current_password: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await updateMyEmail(data);
      toast.success(res.message || EMAIL_CHANGE_FALLBACK);
      reset();
    } catch (error) {
      console.error(error);
      toast.error(accountErrorMessage(error));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Смена email</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            На новый адрес придёт письмо со ссылкой для подтверждения. Email изменится только
            после перехода по ней.
          </Typography>

          <Field.Text name="email" label="Новый email" />
          <Field.Text name="current_password" label="Текущий пароль" type="password" />

          <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
            Сохранить
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}

// ----------------------------------------------------------------------

function PasswordCard() {
  const showPassword = useBoolean();

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(PasswordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await updateMyPassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success(res.message || 'Пароль изменён');
      reset();
    } catch (error) {
      console.error(error);
      toast.error(accountErrorMessage(error));
    }
  });

  const passwordToggle = (
    <InputAdornment position="end">
      <IconButton onClick={showPassword.onToggle} edge="end">
        <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
      </IconButton>
    </InputAdornment>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Смена пароля</Typography>

          <Field.Text
            name="current_password"
            label="Текущий пароль"
            type={showPassword.value ? 'text' : 'password'}
            slotProps={{ input: { endAdornment: passwordToggle } }}
          />
          <Field.Text
            name="new_password"
            label="Новый пароль"
            type={showPassword.value ? 'text' : 'password'}
            helperText="От 8 до 128 символов"
            slotProps={{ input: { endAdornment: passwordToggle } }}
          />
          <Field.Text
            name="confirm_password"
            label="Подтвердите новый пароль"
            type={showPassword.value ? 'text' : 'password'}
            slotProps={{ input: { endAdornment: passwordToggle } }}
          />

          <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
            Сменить пароль
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
```

- [ ] **Step 2: Гейты — tsc + lint**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

Run: `npx eslint --fix src/sections/profile/profile-security-form.tsx; npx eslint src/sections/profile/profile-security-form.tsx`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add src/sections/profile/profile-security-form.tsx
git commit -m "feat(profile): email-change confirm flow + password change UI

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: страница `/confirm-email-change`

**Files:**
- Create: `src/auth/view/confirm-email-change-view.tsx`
- Create: `src/app/confirm-email-change/layout.tsx`
- Create: `src/app/confirm-email-change/page.tsx`

- [ ] **Step 1: Создать view `src/auth/view/confirm-email-change-view.tsx`**

```tsx
'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { confirmEmailChange } from 'src/actions/account';
import { accountErrorMessage } from 'src/actions/account-errors';

import { SentIcon, EmailInboxIcon } from 'src/assets/icons';

import { FormHead } from '../components/form-head';
import { signOut } from '../context/jwt/action';
import { FormReturnLink } from '../components/form-return-link';

// ----------------------------------------------------------------------

export function ConfirmEmailChangeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onConfirm = async () => {
    if (!token) {
      setErrorMessage('Ссылка недействительна или устарела');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await confirmEmailChange(token);
      // Бэкенд отозвал все refresh-токены — чистим локальную сессию.
      await signOut();
      setSuccess(true);
    } catch (error) {
      console.error(error);
      setErrorMessage(accountErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <FormHead
          icon={<SentIcon />}
          title="Email изменён"
          description="Войдите заново, используя новый адрес."
        />

        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={() => router.push(paths.auth.jwt.signIn)}
        >
          Войти
        </Button>
      </>
    );
  }

  return (
    <>
      <FormHead
        icon={<EmailInboxIcon />}
        title="Подтверждение смены email"
        description={`Нажмите кнопку, чтобы завершить смену адреса.\nПосле подтверждения вы выйдете из аккаунта на всех устройствах.`}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
        <Button
          fullWidth
          size="large"
          variant="contained"
          loading={isSubmitting}
          disabled={!token}
          onClick={onConfirm}
        >
          Подтвердить смену email
        </Button>
      </Box>

      <FormReturnLink href={paths.auth.jwt.signIn} label="Вернуться ко входу" />
    </>
  );
}
```

- [ ] **Step 2: Создать layout `src/app/confirm-email-change/layout.tsx`**

Без `GuestGuard` — по ссылке может прийти и залогиненный пользователь, и гость.

```tsx
import { AuthCenteredLayout } from 'src/layouts/auth-centered';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <AuthCenteredLayout>{children}</AuthCenteredLayout>;
}
```

- [ ] **Step 3: Создать page `src/app/confirm-email-change/page.tsx`**

```tsx
import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ConfirmEmailChangeView } from 'src/auth/view/confirm-email-change-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Подтверждение смены email | ${CONFIG.appName}` };

export default function Page() {
  return <ConfirmEmailChangeView />;
}
```

- [ ] **Step 4: Проверить, что `AuthCenteredLayout` экспортируется**

Run: `npx tsc --noEmit`
Expected: 0 ошибок. Если `src/layouts/auth-centered` не имеет barrel-экспорта `AuthCenteredLayout` — поправить импорт на фактический путь (сверить `Glob src/layouts/auth-centered/**`).

- [ ] **Step 5: Гейты — lint**

Run: `npx eslint --fix src/auth/view/confirm-email-change-view.tsx src/app/confirm-email-change/layout.tsx src/app/confirm-email-change/page.tsx; npx eslint src/auth/view/confirm-email-change-view.tsx src/app/confirm-email-change/layout.tsx src/app/confirm-email-change/page.tsx`
Expected: 0 ошибок.

- [ ] **Step 6: Commit**

```bash
git add src/auth/view/confirm-email-change-view.tsx src/app/confirm-email-change/
git commit -m "feat(auth): /confirm-email-change page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: финальная верификация

- [ ] **Step 1: Полный прогон гейтов**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

Run: `npm run lint`
Expected: 0 ошибок.

Run: `npm test`
Expected: зелёно (включая `account-errors.test.ts`).

- [ ] **Step 2: (опц.) рантайм-проверка против бэкенда**

Если `:8000/health/` отвечает 200: на `/dashboard/profile/security` сменить email (ждём toast «Проверьте новый email…», в MailPit приходит письмо), сменить пароль (toast «Пароль изменён»), перейти по ссылке из письма на `/confirm-email-change` → кнопка → успех → редирект на вход.

---

## Self-Review

- **Spec coverage:** endpoints (Task 1 §5) ✓; `updateMyEmail` новый контракт + без `mutate` (Task 1 §6) ✓; `updateMyPassword`/`confirmEmailChange` (Task 1 §6) ✓; `accountErrorMessage` + тест (Task 1 §1-4) ✓; форма email без `checkUserSession` + карточка пароля (Task 2) ✓; страница `/confirm-email-change` по кнопке + `signOut` + состояния (Task 3) ✓; гейты (Task 4) ✓.
- **Placeholders:** нет — весь код приведён целиком.
- **Type consistency:** `IMessageResponse`/`IUserPasswordUpdate` из Task 1 используются в Task 2/3; `accountErrorMessage`, `confirmEmailChange`, `updateMyEmail`, `updateMyPassword` — имена совпадают во всех задачах; `endpoints.auth.password`/`confirmEmailChange` совпадают.
- **Ризк:** barrel-имя `AuthCenteredLayout` — подстраховано шагом Task 3 §4 (сверка пути).
