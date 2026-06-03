# Доступ в ЛК из главного хедера + AccountDrawer + страницы настроек — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Залогиненный юзер на публичных страницах кликает аватарку → открывает AccountDrawer на боевых данных → переходит в ЛК и страницы настроек профиля.

**Architecture:** В хедере главного layout вместо постоянного `SignInButton` ставим компонент-переключатель `AccountControl` (loading → скелетон, authenticated → `AccountDrawer`, иначе `SignInButton`). `AccountDrawer` переводим с `useMockedUser` на `useAuthContext` + ленивый SWR-хук профиля; чистую логику (имя/инициалы и role-aware ссылки «Мои объекты») выносим в тестируемый модуль. Добавляем роут-группу `/dashboard/account` с табами: Профиль (боевой PATCH), Безопасность (смена email), Обратная связь (support-тикет) и две честные заглушки (Уведомления, Соцсети).

**Tech Stack:** Next.js 16 App Router, MUI 7, TypeScript, SWR, react-hook-form + zod, vitest. Бэкенд ShowTail (FastAPI) через прокси `/api`.

---

## Реальность бэкенда (проверено по `:8000/openapi.json`)

- `GET /users/me/profile` → `UserProfileResponse {first_name,last_name,patronymic,country}` (все nullable).
- `PATCH /users/me/profile` ← `UserProfileUpdate` (те же поля, опциональные). **Боевое.**
- `PUT /users/me` ← `UserUpdate {email, current_password}`. Смена email. **Боевое. Смены пароля НЕТ.**
- `POST /support/tickets` ← `TicketCreate {subject*, body*, priority?}`, `priority ∈ {low,normal,high,urgent}`. **Боевое.**
- Настроек уведомлений и соц-ссылок на бэке **нет** → вкладки-заглушки с `Alert severity="info"` и задизейбленными контролами.

`endpoints` (`src/lib/axios.ts`) уже содержит `auth.profile='/users/me/profile'`, `auth.me='/users/me'`, `support.tickets='/support/tickets'` — **новые эндпоинты добавлять не нужно.**

## File Structure

**Создаём:**
- `src/types/account.ts` — типы профиля/тикета.
- `src/layouts/account/account-nav.ts` — чистые хелперы `getUserDisplay`, `getMyObjectLinks` (без JSX, тестируемые).
- `src/layouts/account/account-nav.test.ts` — unit-тесты хелперов.
- `src/actions/account.ts` — SWR-actions профиля/email/тикета.
- `src/layouts/components/account-control.tsx` — переключатель хедера.
- `src/sections/account-settings/account-settings-layout.tsx` — табличный shell ЛК.
- `src/sections/account-settings/account-profile-form.tsx` — форма профиля.
- `src/sections/account-settings/account-email-form.tsx` — смена email.
- `src/sections/account-settings/account-feedback-form.tsx` — support-тикет.
- `src/sections/account-settings/account-placeholder.tsx` — заглушка для уведомлений/соцсетей.
- `src/sections/account-settings/view/index.ts` + 5 view-обёрток.
- `src/app/dashboard/account/{layout,page}.tsx` + `security/`, `notifications/`, `socials/`, `feedback/` `page.tsx`.

**Меняем:**
- `src/routes/paths.ts` — добавить `dashboard.account`.
- `src/layouts/nav-config-account.tsx` — заменить `_account` на `getAccountNavData(can)`.
- `src/layouts/components/account-drawer.tsx` — боевой юзер, убрать демо.
- `src/layouts/main/layout.tsx` — `AccountControl` вместо `SignInButton`, убрать «Purchase».
- `src/layouts/dashboard/layout.tsx` — `AccountControl` вместо `AccountDrawer data={_account}`.

---

## Task 1: Типы аккаунта + роуты

**Files:**
- Create: `src/types/account.ts`
- Modify: `src/routes/paths.ts` (блок `dashboard.user`, добавить рядом `account`)

- [ ] **Step 1: Создать `src/types/account.ts`**

```ts
// ----------------------------------------------------------------------
// Профиль пользователя (GET/PATCH /users/me/profile)

export type IUserProfile = {
  first_name: string | null;
  last_name: string | null;
  patronymic: string | null;
  country: string | null;
};

export type IUserProfileUpdate = Partial<IUserProfile>;

// Смена email (PUT /users/me)
export type IUserEmailUpdate = {
  email: string;
  current_password: string;
};

// Обращение в поддержку (POST /support/tickets)
export type ITicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type ITicketCreate = {
  subject: string;
  body: string;
  priority?: ITicketPriority;
};
```

- [ ] **Step 2: Добавить `account` в `paths.ts`**

В `src/routes/paths.ts`, внутри объекта `dashboard`, сразу после закрывающей `}` блока `user: { ... }` (после строки `},` на месте `demo: { edit: ... }` блока user — т.е. между `user: {...},` и `dogs: {...}`), вставить:

```ts
    account: {
      root: `${ROOTS.DASHBOARD}/account`,
      security: `${ROOTS.DASHBOARD}/account/security`,
      notifications: `${ROOTS.DASHBOARD}/account/notifications`,
      socials: `${ROOTS.DASHBOARD}/account/socials`,
      feedback: `${ROOTS.DASHBOARD}/account/feedback`,
    },
```

- [ ] **Step 3: Проверить типы**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 4: Lint + commit**

```bash
npx eslint --fix src/types/account.ts src/routes/paths.ts
npx eslint src/types/account.ts src/routes/paths.ts
git add src/types/account.ts src/routes/paths.ts
git commit -m "feat(account): add account types and dashboard.account paths

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Чистые хелперы (TDD) — имя/инициалы + role-aware ссылки

**Files:**
- Create: `src/layouts/account/account-nav.ts`
- Test: `src/layouts/account/account-nav.test.ts`

Чистая логика → пишем тесты первыми (vitest, `environment: node`, include `src/**/*.test.ts`).

- [ ] **Step 1: Написать падающий тест `src/layouts/account/account-nav.test.ts`**

```ts
import { describe, it, expect } from 'vitest';

import { paths } from 'src/routes/paths';

import { getUserDisplay, getMyObjectLinks } from './account-nav';

describe('getUserDisplay', () => {
  it('строит имя из first_name + last_name', () => {
    const r = getUserDisplay({ email: 'a@b.c' }, { first_name: 'Иван', last_name: 'Петров', patronymic: null, country: null });
    expect(r.displayName).toBe('Иван Петров');
    expect(r.initial).toBe('И');
    expect(r.email).toBe('a@b.c');
  });

  it('падает на email, когда профиль пуст', () => {
    const r = getUserDisplay({ email: 'demo@x.io' }, undefined);
    expect(r.displayName).toBe('demo@x.io');
    expect(r.initial).toBe('D');
  });

  it('не падает на полностью пустых данных', () => {
    const r = getUserDisplay(null, null);
    expect(r.displayName).toBe('');
    expect(r.initial).toBe('?');
    expect(r.email).toBe('');
  });
});

describe('getMyObjectLinks', () => {
  it('breeder (полные права) видит все три ссылки', () => {
    const can = (p: string) => ['kennels', 'dogs', 'litters'].includes(p);
    const links = getMyObjectLinks(can);
    expect(links.map((l) => l.key)).toEqual(['kennels', 'dogs', 'litters']);
    expect(links[0].href).toBe(paths.dashboard.kennels.root);
  });

  it('view-only права не дают ссылок', () => {
    const can = (p: string) => p === 'kennels:view' || p === 'dogs:view';
    expect(getMyObjectLinks(can)).toEqual([]);
  });

  it('частичные права фильтруются', () => {
    const can = (p: string) => p === 'dogs';
    const links = getMyObjectLinks(can);
    expect(links.map((l) => l.key)).toEqual(['dogs']);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test`
Expected: FAIL — модуль `./account-nav` не найден / экспортов нет.

- [ ] **Step 3: Реализовать `src/layouts/account/account-nav.ts`**

```ts
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

type ProfileLike = { first_name?: string | null; last_name?: string | null } | null | undefined;
type UserLike = { email?: string | null } | null | undefined;

export type UserDisplay = { displayName: string; initial: string; email: string };

/** Имя для шапки/аватара: "Имя Фамилия" из профиля, иначе email; инициал — первая буква. */
export function getUserDisplay(user: UserLike, profile: ProfileLike): UserDisplay {
  const email = user?.email ?? '';
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
  const displayName = name || email;
  const initial = (displayName.charAt(0) || '?').toUpperCase();
  return { displayName, initial, email };
}

// ----------------------------------------------------------------------

export type MyObjectKey = 'kennels' | 'dogs' | 'litters';
export type MyObjectLink = { key: MyObjectKey; label: string; href: string };

// Показываем только владельцам (полное право на ресурс), не view-only.
const MY_OBJECTS: { key: MyObjectKey; label: string; href: string; perm: string }[] = [
  { key: 'kennels', label: 'Мои питомники', href: paths.dashboard.kennels.root, perm: 'kennels' },
  { key: 'dogs', label: 'Мои собаки', href: paths.dashboard.dogs.root, perm: 'dogs' },
  { key: 'litters', label: 'Мои помёты', href: paths.dashboard.litters.root, perm: 'litters' },
];

/** Ссылки «Мои объекты», отфильтрованные по правам (cascade: `kennels` покрывает `kennels:view`, но не наоборот). */
export function getMyObjectLinks(can: (perm: string) => boolean): MyObjectLink[] {
  return MY_OBJECTS.filter((i) => can(i.perm)).map(({ key, label, href }) => ({ key, label, href }));
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test`
Expected: PASS (6 тестов).

- [ ] **Step 5: tsc + lint + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/layouts/account/account-nav.ts src/layouts/account/account-nav.test.ts
npx eslint src/layouts/account/account-nav.ts src/layouts/account/account-nav.test.ts
git add src/layouts/account/account-nav.ts src/layouts/account/account-nav.test.ts
git commit -m "feat(account): pure helpers for user display and my-objects links (TDD)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: SWR-actions профиля/email/тикета

**Files:**
- Create: `src/actions/account.ts`

- [ ] **Step 1: Создать `src/actions/account.ts`** (паттерн `src/actions/kennel.ts`)

```ts
import type { SWRConfiguration } from 'swr';
import type {
  IUserProfile,
  ITicketCreate,
  IUserEmailUpdate,
  IUserProfileUpdate,
} from 'src/types/account';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useMyProfile(enabled = true) {
  const key = enabled ? endpoints.auth.profile : null;

  const { data, isLoading, error, isValidating } = useSWR<IUserProfile>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      profile: data,
      profileLoading: isLoading,
      profileError: error,
      profileValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export async function updateMyProfile(payload: IUserProfileUpdate): Promise<IUserProfile> {
  const res = await axios.patch<IUserProfile>(endpoints.auth.profile, payload);
  await mutate(endpoints.auth.profile);
  return res.data;
}

export async function updateMyEmail(payload: IUserEmailUpdate): Promise<void> {
  await axios.put(endpoints.auth.me, payload);
}

export async function createSupportTicket(payload: ITicketCreate): Promise<void> {
  await axios.post(endpoints.support.tickets, payload);
}
```

- [ ] **Step 2: tsc**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: lint + commit**

```bash
npx eslint --fix src/actions/account.ts
npx eslint src/actions/account.ts
git add src/actions/account.ts
git commit -m "feat(account): SWR actions for profile, email change and support ticket

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: nav-config-account → `getAccountNavData(can)`

**Files:**
- Modify: `src/layouts/nav-config-account.tsx`

Добавляем функцию `getAccountNavData`. Старый экспорт `_account` пока **оставляем** (его потребитель — dashboard layout — переключим в Task 7), чтобы коммит был зелёным.

- [ ] **Step 1: Переписать `src/layouts/nav-config-account.tsx`**

```tsx
import type { AccountDrawerProps } from './components/account-drawer';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { getMyObjectLinks } from './account/account-nav';

// ----------------------------------------------------------------------

type AccountNavData = NonNullable<AccountDrawerProps['data']>;

const OBJECT_ICON: Record<string, string> = {
  kennels: 'solar:home-2-bold-duotone',
  dogs: 'solar:notes-bold-duotone',
  litters: 'solar:users-group-rounded-bold-duotone',
};

/** Боевые пункты drawer: Дашборд + Настройки + role-aware «Мои объекты». */
export function getAccountNavData(can: (perm: string) => boolean): AccountNavData {
  const base: AccountNavData = [
    {
      label: 'Дашборд',
      href: paths.dashboard.root,
      icon: <Iconify icon="solar:home-angle-bold-duotone" />,
    },
    {
      label: 'Настройки профиля',
      href: paths.dashboard.account.root,
      icon: <Iconify icon="solar:settings-bold-duotone" />,
    },
  ];

  const myObjects: AccountNavData = getMyObjectLinks(can).map((link) => ({
    label: link.label,
    href: link.href,
    icon: <Iconify icon={OBJECT_ICON[link.key]} />,
  }));

  return [...base, ...myObjects];
}

// ----------------------------------------------------------------------
// Демо-конфиг Minimal (потребитель переключается в Task 7, затем удалится).

export const _account: AccountDrawerProps['data'] = [
  { label: 'Home', href: '/', icon: <Iconify icon="solar:home-angle-bold-duotone" /> },
  { label: 'Profile', href: '#', icon: <Iconify icon="custom:profile-duotone" /> },
  { label: 'Account settings', href: '#', icon: <Iconify icon="solar:settings-bold-duotone" /> },
];
```

- [ ] **Step 2: tsc**

Run: `npx tsc --noEmit`
Expected: 0 ошибок. (Иконки `solar:home-2-bold-duotone`, `solar:notes-bold-duotone`, `solar:users-group-rounded-bold-duotone`, `solar:home-angle-bold-duotone`, `solar:settings-bold-duotone` — зарегистрированы в `icon-sets.ts`.)

- [ ] **Step 3: lint + commit**

```bash
npx eslint --fix src/layouts/nav-config-account.tsx
npx eslint src/layouts/nav-config-account.tsx
git add src/layouts/nav-config-account.tsx
git commit -m "feat(account): getAccountNavData with role-aware my-objects links

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: AccountDrawer на боевых данных

**Files:**
- Modify: `src/layouts/components/account-drawer.tsx`

Убираем `useMockedUser`, `_mock` (переключение аккаунтов), `UpgradeBlock`; имя/инициалы — через `getUserDisplay`; список ссылок упрощаем (без свопа «Home»).

- [ ] **Step 1: Заменить содержимое `src/layouts/components/account-drawer.tsx`**

```tsx
'use client';

import type { IconButtonProps } from '@mui/material/IconButton';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { AnimateBorder } from 'src/components/animate';

import { useAuthContext } from 'src/auth/hooks';

import { useMyProfile } from 'src/actions/account';

import { getUserDisplay } from '../account/account-nav';
import { AccountButton } from './account-button';
import { SignOutButton } from './sign-out-button';

// ----------------------------------------------------------------------

export type AccountDrawerProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
  }[];
};

export function AccountDrawer({ data = [], sx, ...other }: AccountDrawerProps) {
  const { user, authenticated } = useAuthContext();
  const { profile } = useMyProfile(authenticated);

  const { displayName, initial, email } = getUserDisplay(user, profile);

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const renderAvatar = () => (
    <AnimateBorder
      sx={{ mb: 2, p: '6px', width: 96, height: 96, borderRadius: '50%' }}
      slotProps={{ primaryBorder: { size: 120, sx: { color: 'primary.main' } } }}
    >
      <Avatar alt={displayName} sx={{ width: 1, height: 1 }}>
        {initial}
      </Avatar>
    </AnimateBorder>
  );

  const renderList = () => (
    <MenuList
      disablePadding
      sx={[
        (theme) => ({
          py: 3,
          px: 2.5,
          borderTop: `dashed 1px ${theme.vars.palette.divider}`,
          borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
          '& li': { p: 0 },
        }),
      ]}
    >
      {data.map((option) => (
        <MenuItem key={option.label}>
          <Link
            component={RouterLink}
            href={option.href}
            color="inherit"
            underline="none"
            onClick={onClose}
            sx={{
              p: 1,
              width: 1,
              display: 'flex',
              typography: 'body2',
              alignItems: 'center',
              color: 'text.secondary',
              '& svg': { width: 24, height: 24 },
              '&:hover': { color: 'text.primary' },
            }}
          >
            {option.icon}
            <Box component="span" sx={{ ml: 2 }}>
              {option.label}
            </Box>
            {option.info && (
              <Label color="error" sx={{ ml: 1 }}>
                {option.info}
              </Label>
            )}
          </Link>
        </MenuItem>
      ))}
    </MenuList>
  );

  return (
    <>
      <AccountButton
        onClick={onOpen}
        photoURL=""
        displayName={displayName}
        sx={sx}
        {...other}
      />

      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{ backdrop: { invisible: true }, paper: { sx: { width: 320 } } }}
      >
        <IconButton
          onClick={onClose}
          sx={{ top: 12, left: 12, zIndex: 9, position: 'absolute' }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>

        <Scrollbar>
          <Box sx={{ pt: 8, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            {renderAvatar()}

            <Typography variant="subtitle1" noWrap sx={{ mt: 2 }}>
              {displayName}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }} noWrap>
              {email}
            </Typography>
          </Box>

          {renderList()}
        </Scrollbar>

        <Box sx={{ p: 2.5 }}>
          <SignOutButton onClose={onClose} />
        </Box>
      </Drawer>
    </>
  );
}
```

- [ ] **Step 2: tsc**

Run: `npx tsc --noEmit`
Expected: 0 ошибок. (Удалены импорты `varAlpha`, `Tooltip`, `usePathname`, `paths`, `_mock`, `useMockedUser`, `UpgradeBlock`, `pathname` — убедиться, что неиспользуемых не осталось.)

- [ ] **Step 3: lint + commit**

```bash
npx eslint --fix src/layouts/components/account-drawer.tsx
npx eslint src/layouts/components/account-drawer.tsx
git add src/layouts/components/account-drawer.tsx
git commit -m "refactor(account): drawer on real auth user, drop mock/switch-account/upgrade

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: AccountControl (переключатель хедера)

**Files:**
- Create: `src/layouts/components/account-control.tsx`

- [ ] **Step 1: Создать `src/layouts/components/account-control.tsx`**

```tsx
'use client';

import type { IconButtonProps } from '@mui/material/IconButton';

import Skeleton from '@mui/material/Skeleton';

import { usePermissions } from 'src/hooks/use-permissions';

import { useAuthContext } from 'src/auth/hooks';

import { getAccountNavData } from '../nav-config-account';
import { AccountDrawer } from './account-drawer';
import { SignInButton } from './sign-in-button';

// ----------------------------------------------------------------------

/**
 * Хедер-переключатель: пока грузится сессия — скелетон (без скачка layout);
 * залогинен — AccountDrawer (аватар + ЛК); иначе — кнопка входа.
 */
export function AccountControl({ sx, ...other }: IconButtonProps) {
  const { authenticated, loading } = useAuthContext();
  const { can } = usePermissions();

  if (loading) {
    return <Skeleton variant="circular" width={40} height={40} />;
  }

  if (!authenticated) {
    return <SignInButton />;
  }

  return <AccountDrawer data={getAccountNavData(can)} sx={sx} {...other} />;
}
```

- [ ] **Step 2: tsc**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: lint + commit**

```bash
npx eslint --fix src/layouts/components/account-control.tsx
npx eslint src/layouts/components/account-control.tsx
git add src/layouts/components/account-control.tsx
git commit -m "feat(account): AccountControl header switch (skeleton/drawer/sign-in)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Подключить AccountControl в оба layout + убрать «Purchase» и `_account`

**Files:**
- Modify: `src/layouts/main/layout.tsx`
- Modify: `src/layouts/dashboard/layout.tsx`
- Modify: `src/layouts/nav-config-account.tsx` (удалить `_account`)

- [ ] **Step 1: Главный layout — импорты**

В `src/layouts/main/layout.tsx`:

Удалить строки:
```tsx
import Button from '@mui/material/Button';
import { paths } from 'src/routes/paths';
import { SignInButton } from '../components/sign-in-button';
```
Добавить (рядом с другими импортами `../components/...`):
```tsx
import { AccountControl } from '../components/account-control';
```

- [ ] **Step 2: Главный layout — rightArea**

Заменить блок от `{/** @slot Sign in button */}` до конца кнопки «Purchase» (включительно), т.е. этот фрагмент:
```tsx
            {/** @slot Sign in button */}
            <SignInButton />

            {/** @slot Purchase button */}
            <Button
              variant="contained"
              rel="noopener noreferrer"
              target="_blank"
              href={paths.minimalStore}
              sx={(theme) => ({
                display: 'none',
                [theme.breakpoints.up(layoutQuery)]: { display: 'inline-flex' },
              })}
            >
              Purchase
            </Button>
```
на:
```tsx
            {/** @slot Account control (drawer when signed in, sign-in button otherwise) */}
            <AccountControl />
```

- [ ] **Step 3: Dashboard layout**

В `src/layouts/dashboard/layout.tsx`:

Удалить строки:
```tsx
import { _account } from '../nav-config-account';
import { AccountDrawer } from '../components/account-drawer';
```
Добавить:
```tsx
import { AccountControl } from '../components/account-control';
```
Заменить:
```tsx
          {/** @slot Account drawer */}
          <AccountDrawer data={_account} />
```
на:
```tsx
          {/** @slot Account control */}
          <AccountControl />
```

- [ ] **Step 4: Удалить `_account` из nav-config-account**

В `src/layouts/nav-config-account.tsx` удалить весь блок (комментарий + экспорт `_account`):
```tsx
// ----------------------------------------------------------------------
// Демо-конфиг Minimal (потребитель переключается в Task 7, затем удалится).

export const _account: AccountDrawerProps['data'] = [
  { label: 'Home', href: '/', icon: <Iconify icon="solar:home-angle-bold-duotone" /> },
  { label: 'Profile', href: '#', icon: <Iconify icon="custom:profile-duotone" /> },
  { label: 'Account settings', href: '#', icon: <Iconify icon="solar:settings-bold-duotone" /> },
];
```

- [ ] **Step 5: Проверить, что `_account` больше нигде не используется**

Run: `npx eslint src/layouts/main/layout.tsx src/layouts/dashboard/layout.tsx src/layouts/nav-config-account.tsx`
Дополнительно (вне tool, через ваш grep): убедиться, что строк с `_account` не осталось. Ожидание: совпадений нет.

- [ ] **Step 6: tsc**

Run: `npx tsc --noEmit`
Expected: 0 ошибок (нет неиспользуемых импортов `Button`, `paths`, `SignInButton`, `_account`, `AccountDrawer`).

- [ ] **Step 7: lint + commit**

```bash
npx eslint --fix src/layouts/main/layout.tsx src/layouts/dashboard/layout.tsx src/layouts/nav-config-account.tsx
npx eslint src/layouts/main/layout.tsx src/layouts/dashboard/layout.tsx src/layouts/nav-config-account.tsx
git add src/layouts/main/layout.tsx src/layouts/dashboard/layout.tsx src/layouts/nav-config-account.tsx
git commit -m "feat(account): wire AccountControl in main+dashboard headers, drop Purchase and _account

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Табличный shell ЛК + view-обёртки

**Files:**
- Create: `src/sections/account-settings/account-settings-layout.tsx`
- Create: `src/sections/account-settings/view/index.ts`

Делаем shell с табами (по образцу `src/sections/account/account-layout.tsx`) и пустые view-обёртки заполним в следующих тасках. Чтобы коммит был зелёным, на этом шаге создаём только layout + index с реэкспортами, которые добавим по мере готовности форм. Поэтому формы (Task 9–11) идут до финальной сборки роутов (Task 12).

- [ ] **Step 1: Создать `src/sections/account-settings/account-settings-layout.tsx`**

```tsx
'use client';

import type { DashboardContentProps } from 'src/layouts/dashboard';

import { removeLastSlash } from 'minimal-shared/utils';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'Профиль', icon: <Iconify width={24} icon="solar:user-id-bold" />, href: paths.dashboard.account.root },
  { label: 'Безопасность', icon: <Iconify width={24} icon="ic:round-vpn-key" />, href: paths.dashboard.account.security },
  { label: 'Уведомления', icon: <Iconify width={24} icon="solar:bell-bing-bold" />, href: paths.dashboard.account.notifications },
  { label: 'Соцсети', icon: <Iconify width={24} icon="solar:share-bold" />, href: paths.dashboard.account.socials },
  { label: 'Обратная связь', icon: <Iconify width={24} icon="solar:chat-round-dots-bold" />, href: paths.dashboard.account.feedback },
];

// ----------------------------------------------------------------------

export function AccountSettingsLayout({ children, ...other }: DashboardContentProps) {
  const pathname = usePathname();

  return (
    <DashboardContent {...other}>
      <CustomBreadcrumbs
        heading="Личный кабинет"
        links={[{ name: 'Дашборд', href: paths.dashboard.root }, { name: 'Настройки' }]}
        sx={{ mb: 3 }}
      />

      <Tabs value={removeLastSlash(pathname)} sx={{ mb: { xs: 3, md: 5 } }}>
        {NAV_ITEMS.map((tab) => (
          <Tab
            component={RouterLink}
            key={tab.href}
            label={tab.label}
            icon={tab.icon}
            value={tab.href}
            href={tab.href}
          />
        ))}
      </Tabs>

      {children}
    </DashboardContent>
  );
}
```

- [ ] **Step 2: Создать `src/sections/account-settings/view/index.ts`** (заполнится в Task 9–11)

```ts
export {};
```

- [ ] **Step 3: tsc + lint + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/account-settings/account-settings-layout.tsx src/sections/account-settings/view/index.ts
npx eslint src/sections/account-settings/account-settings-layout.tsx src/sections/account-settings/view/index.ts
git add src/sections/account-settings/account-settings-layout.tsx src/sections/account-settings/view/index.ts
git commit -m "feat(account): settings tabs shell (profile/security/notifications/socials/feedback)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Форма профиля (боевой PATCH)

**Files:**
- Create: `src/sections/account-settings/account-profile-form.tsx`
- Create: `src/sections/account-settings/view/account-profile-view.tsx`
- Modify: `src/sections/account-settings/view/index.ts`

- [ ] **Step 1: Создать `src/sections/account-settings/account-profile-form.tsx`**

```tsx
'use client';

import type { IUserProfile } from 'src/types/account';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useAuthContext } from 'src/auth/hooks';

import { useMyProfile, updateMyProfile } from 'src/actions/account';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { getUserDisplay } from 'src/layouts/account/account-nav';

// ----------------------------------------------------------------------

export type ProfileSchemaType = z.infer<typeof ProfileSchema>;

export const ProfileSchema = z.object({
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  patronymic: z.string().nullable(),
  country: z.string().nullable(),
});

const EMPTY: ProfileSchemaType = {
  first_name: null,
  last_name: null,
  patronymic: null,
  country: null,
};

// ----------------------------------------------------------------------

export function AccountProfileForm() {
  const { user } = useAuthContext();
  const { profile } = useMyProfile();

  const { initial } = getUserDisplay(user, profile);

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(ProfileSchema),
    defaultValues: EMPTY,
    values: profile
      ? {
          first_name: profile.first_name,
          last_name: profile.last_name,
          patronymic: profile.patronymic,
          country: profile.country,
        }
      : undefined,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateMyProfile(data as IUserProfile);
      toast.success('Профиль обновлён');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 64, height: 64 }}>{initial}</Avatar>
          <Box>
            <Typography variant="subtitle2">Аватар</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Загрузка аватара появится позже
            </Typography>
          </Box>
        </Card>

        <Card sx={{ p: 3 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
            }}
          >
            <Field.Text name="last_name" label="Фамилия" />
            <Field.Text name="first_name" label="Имя" />
            <Field.Text name="patronymic" label="Отчество" />
            <Field.CountrySelect name="country" label="Страна" placeholder="Выберите страну" />
          </Box>

          <Stack spacing={3} sx={{ mt: 3, alignItems: 'flex-end' }}>
            <Alert severity="info" sx={{ width: 1 }}>
              Email меняется на вкладке «Безопасность».
            </Alert>
            <Button type="submit" variant="contained" loading={isSubmitting}>
              Сохранить изменения
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Form>
  );
}
```

- [ ] **Step 2: Создать `src/sections/account-settings/view/account-profile-view.tsx`**

```tsx
'use client';

import { AccountProfileForm } from '../account-profile-form';

// ----------------------------------------------------------------------

export function AccountProfileView() {
  return <AccountProfileForm />;
}
```

- [ ] **Step 3: Обновить `src/sections/account-settings/view/index.ts`**

```ts
export * from './account-profile-view';
```

- [ ] **Step 4: tsc + lint + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/account-settings/account-profile-form.tsx src/sections/account-settings/view/account-profile-view.tsx src/sections/account-settings/view/index.ts
npx eslint src/sections/account-settings/account-profile-form.tsx src/sections/account-settings/view/account-profile-view.tsx src/sections/account-settings/view/index.ts
git add src/sections/account-settings/account-profile-form.tsx src/sections/account-settings/view/account-profile-view.tsx src/sections/account-settings/view/index.ts
git commit -m "feat(account): profile settings form wired to /users/me/profile

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Смена email (Безопасность) + Обратная связь (support)

**Files:**
- Create: `src/sections/account-settings/account-email-form.tsx`
- Create: `src/sections/account-settings/account-feedback-form.tsx`
- Create: `src/sections/account-settings/view/account-security-view.tsx`
- Create: `src/sections/account-settings/view/account-feedback-view.tsx`
- Modify: `src/sections/account-settings/view/index.ts`

- [ ] **Step 1: Создать `src/sections/account-settings/account-email-form.tsx`**

```tsx
'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { useAuthContext } from 'src/auth/hooks';

import { updateMyEmail } from 'src/actions/account';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type EmailSchemaType = z.infer<typeof EmailSchema>;

export const EmailSchema = z.object({
  email: z.string().min(1, { error: 'Введите email' }).email({ error: 'Некорректный email' }),
  current_password: z.string().min(1, { error: 'Введите текущий пароль' }),
});

// ----------------------------------------------------------------------

export function AccountEmailForm() {
  const { checkUserSession } = useAuthContext();

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
      await updateMyEmail(data);
      await checkUserSession?.();
      toast.success('Email обновлён');
      reset();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Не удалось сменить email');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Alert severity="info">
            Смена пароля пока недоступна на сервере — здесь можно изменить email, подтвердив
            текущим паролем.
          </Alert>

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
```

- [ ] **Step 2: Создать `src/sections/account-settings/account-feedback-form.tsx`**

```tsx
'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

import { createSupportTicket } from 'src/actions/account';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type FeedbackSchemaType = z.infer<typeof FeedbackSchema>;

export const FeedbackSchema = z.object({
  subject: z.string().min(1, { error: 'Введите тему' }),
  body: z.string().min(1, { error: 'Введите сообщение' }),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
});

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'normal', label: 'Обычный' },
  { value: 'high', label: 'Высокий' },
  { value: 'urgent', label: 'Срочный' },
];

// ----------------------------------------------------------------------

export function AccountFeedbackForm() {
  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(FeedbackSchema),
    defaultValues: { subject: '', body: '', priority: 'normal' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createSupportTicket(data);
      toast.success('Обращение отправлено');
      reset();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Не удалось отправить');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Field.Text name="subject" label="Тема" />
          <Field.Select name="priority" label="Приоритет">
            {PRIORITY_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text name="body" label="Сообщение" multiline rows={4} />

          <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
            Отправить
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
```

- [ ] **Step 3: Создать view-обёртки**

`src/sections/account-settings/view/account-security-view.tsx`:
```tsx
'use client';

import { AccountEmailForm } from '../account-email-form';

// ----------------------------------------------------------------------

export function AccountSecurityView() {
  return <AccountEmailForm />;
}
```

`src/sections/account-settings/view/account-feedback-view.tsx`:
```tsx
'use client';

import { AccountFeedbackForm } from '../account-feedback-form';

// ----------------------------------------------------------------------

export function AccountFeedbackView() {
  return <AccountFeedbackForm />;
}
```

- [ ] **Step 4: Обновить `src/sections/account-settings/view/index.ts`**

```ts
export * from './account-profile-view';
export * from './account-security-view';
export * from './account-feedback-view';
```

- [ ] **Step 5: tsc + lint + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/account-settings/account-email-form.tsx src/sections/account-settings/account-feedback-form.tsx src/sections/account-settings/view/account-security-view.tsx src/sections/account-settings/view/account-feedback-view.tsx src/sections/account-settings/view/index.ts
npx eslint src/sections/account-settings/account-email-form.tsx src/sections/account-settings/account-feedback-form.tsx src/sections/account-settings/view/account-security-view.tsx src/sections/account-settings/view/account-feedback-view.tsx src/sections/account-settings/view/index.ts
git add src/sections/account-settings/account-email-form.tsx src/sections/account-settings/account-feedback-form.tsx src/sections/account-settings/view/account-security-view.tsx src/sections/account-settings/view/account-feedback-view.tsx src/sections/account-settings/view/index.ts
git commit -m "feat(account): email change (PUT /users/me) and support ticket forms

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: Заглушки «Уведомления» и «Соцсети»

**Files:**
- Create: `src/sections/account-settings/account-placeholder.tsx`
- Create: `src/sections/account-settings/view/account-notifications-view.tsx`
- Create: `src/sections/account-settings/view/account-socials-view.tsx`
- Modify: `src/sections/account-settings/view/index.ts`

Бэкенд этих настроек не хранит → честная заглушка (info-Alert + задизейбленные контролы), без фейкового «успеха».

- [ ] **Step 1: Создать `src/sections/account-settings/account-placeholder.tsx`**

```tsx
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

type Props = {
  variant: 'notifications' | 'socials';
};

const NOTIFICATION_ITEMS = ['Новые сообщения', 'Результаты шоу', 'Объявления'];
const SOCIAL_ITEMS = ['Instagram', 'Facebook', 'VK', 'Telegram'];

export function AccountPlaceholder({ variant }: Props) {
  const isNotifications = variant === 'notifications';

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Alert severity="info">Раздел появится после поддержки на сервере.</Alert>

        {isNotifications
          ? NOTIFICATION_ITEMS.map((label) => (
              <FormControlLabel
                key={label}
                disabled
                control={<Switch />}
                label={label}
                sx={{ m: 0, justifyContent: 'space-between' }}
              />
            ))
          : SOCIAL_ITEMS.map((label) => (
              <TextField key={label} disabled label={label} placeholder="https://" />
            ))}

        <Button disabled variant="contained" sx={{ ml: 'auto' }}>
          Сохранить
        </Button>
      </Stack>
    </Card>
  );
}
```

- [ ] **Step 2: Создать view-обёртки**

`src/sections/account-settings/view/account-notifications-view.tsx`:
```tsx
'use client';

import { AccountPlaceholder } from '../account-placeholder';

// ----------------------------------------------------------------------

export function AccountNotificationsView() {
  return <AccountPlaceholder variant="notifications" />;
}
```

`src/sections/account-settings/view/account-socials-view.tsx`:
```tsx
'use client';

import { AccountPlaceholder } from '../account-placeholder';

// ----------------------------------------------------------------------

export function AccountSocialsView() {
  return <AccountPlaceholder variant="socials" />;
}
```

- [ ] **Step 3: Обновить `src/sections/account-settings/view/index.ts`**

```ts
export * from './account-profile-view';
export * from './account-socials-view';
export * from './account-security-view';
export * from './account-feedback-view';
export * from './account-notifications-view';
```

- [ ] **Step 4: tsc + lint + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/account-settings/account-placeholder.tsx src/sections/account-settings/view/account-notifications-view.tsx src/sections/account-settings/view/account-socials-view.tsx src/sections/account-settings/view/index.ts
npx eslint src/sections/account-settings/account-placeholder.tsx src/sections/account-settings/view/account-notifications-view.tsx src/sections/account-settings/view/account-socials-view.tsx src/sections/account-settings/view/index.ts
git add src/sections/account-settings/account-placeholder.tsx src/sections/account-settings/view/account-notifications-view.tsx src/sections/account-settings/view/account-socials-view.tsx src/sections/account-settings/view/index.ts
git commit -m "feat(account): notifications/socials placeholder tabs (no backend yet)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: Роуты App Router `/dashboard/account/*` + финальная проверка

**Files:**
- Create: `src/app/dashboard/account/layout.tsx`
- Create: `src/app/dashboard/account/page.tsx`
- Create: `src/app/dashboard/account/security/page.tsx`
- Create: `src/app/dashboard/account/notifications/page.tsx`
- Create: `src/app/dashboard/account/socials/page.tsx`
- Create: `src/app/dashboard/account/feedback/page.tsx`

- [ ] **Step 1: Создать `src/app/dashboard/account/layout.tsx`**

```tsx
import { AccountSettingsLayout } from 'src/sections/account-settings/account-settings-layout';

// ----------------------------------------------------------------------

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  return <AccountSettingsLayout>{children}</AccountSettingsLayout>;
}
```

- [ ] **Step 2: Создать `src/app/dashboard/account/page.tsx`**

```tsx
import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AccountProfileView } from 'src/sections/account-settings/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Профиль | ${CONFIG.appName}` };

export default function Page() {
  return <AccountProfileView />;
}
```

- [ ] **Step 3: Создать `src/app/dashboard/account/security/page.tsx`**

```tsx
import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AccountSecurityView } from 'src/sections/account-settings/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Безопасность | ${CONFIG.appName}` };

export default function Page() {
  return <AccountSecurityView />;
}
```

- [ ] **Step 4: Создать `src/app/dashboard/account/notifications/page.tsx`**

```tsx
import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AccountNotificationsView } from 'src/sections/account-settings/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Уведомления | ${CONFIG.appName}` };

export default function Page() {
  return <AccountNotificationsView />;
}
```

- [ ] **Step 5: Создать `src/app/dashboard/account/socials/page.tsx`**

```tsx
import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AccountSocialsView } from 'src/sections/account-settings/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Соцсети | ${CONFIG.appName}` };

export default function Page() {
  return <AccountSocialsView />;
}
```

- [ ] **Step 6: Создать `src/app/dashboard/account/feedback/page.tsx`**

```tsx
import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AccountFeedbackView } from 'src/sections/account-settings/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Обратная связь | ${CONFIG.appName}` };

export default function Page() {
  return <AccountFeedbackView />;
}
```

- [ ] **Step 7: Полный прогон гейтов**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

Run: `npx eslint "src/**/*.{ts,tsx}"`
Expected: 0 ошибок (при необходимости `npm run lint:fix`).

Run: `npm test`
Expected: PASS (тесты Task 2 зелёные).

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/account
git commit -m "feat(account): /dashboard/account routes (profile/security/notifications/socials/feedback)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 9: Рантайм-проверка (если бэкенд на :8000 отвечает 200 на /health)**

Запустить `npm run dev` (порт 8082), под боевым юзером (`admin@admin.com`):
1. На `/` (главная) в хедере — аватар с инициалом вместо «Sign in»; «Purchase» отсутствует.
2. Клик по аватару → drawer: имя/email боевые, ссылки «Дашборд», «Настройки профиля», role-aware «Мои…».
3. Drawer → «Настройки профиля» → `/dashboard/account`: правка фамилии/имени/страны → «Сохранить» → toast success; перезагрузка страницы сохраняет значения.
4. «Безопасность»: смена email с текущим паролем → toast success.
5. «Обратная связь»: тема+сообщение → toast success (тикет создан).
6. «Уведомления»/«Соцсети»: info-Alert, контролы задизейблены.
7. В инкогнито (не залогинен) на `/` — кнопка «Sign in».

---

## Self-Review (выполнено)

- **Покрытие спеки:** (1) auth-gating хедера → Task 6–7; (2) drawer на боевых данных без демо → Task 5; role-aware «Мои объекты» → Task 2/4; (3) страницы настроек → Task 8–12. Профиль (боевой), Безопасность (email вместо пароля — по факту бэка), Уведомления/Соцсети (заглушки), Обратная связь (support) — все вкладки на месте. «Purchase» убран (Task 7). Аватар = инициалы (Task 5, форма профиля Task 9).
- **Отклонение от спеки (осознанное):** вместо «смены пароля» — смена email (на бэке нет password-change); «Соцсети»/«Уведомления» — заглушки (нет бэка); аватар на странице профиля — обычный `Avatar` с инициалом + подпись «скоро» вместо задизейбленного `UploadAvatar` (по уточнению пользователя «аватар умеет принимать текст»).
- **Плейсхолдеры:** нет — весь код приведён; заглушки уведомлений/соцсетей реализованы явным компонентом, не «TODO».
- **Согласованность типов/имён:** `getUserDisplay`/`getMyObjectLinks` (Task 2) используются в Task 4/5/9 с теми же сигнатурами; `getAccountNavData(can)` (Task 4) вызывается в Task 6; экспорты `Account*View` из `view/index.ts` совпадают с импортами в роутах Task 12; `endpoints.auth.profile/me`, `endpoints.support.tickets` существуют; иконки — из реестра.
- **Порядок коммитов зелёный:** `_account` живёт до Task 7; формы (Task 9–11) наполняют `view/index.ts` до сборки роутов (Task 12).
```
