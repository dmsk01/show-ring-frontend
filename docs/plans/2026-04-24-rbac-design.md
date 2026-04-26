# RBAC для show-ring — дизайн и план внедрения

**Дата:** 2026-04-24
**Статус:** утверждён, готов к реализации
**Исходник-референс:** `c:\Users\user\Desktop\new-zst-expo\docs\plans\2026-03-24-rbac-design.md` (Vue/Pinia, проект «Застава»)

---

## 0. TL;DR

Портируем RBAC-модель проекта «Застава» на стек show-ring (Next.js 15 / React 19 / MUI 7 + React Native / Expo) с осознанными упрощениями:

- **Убираем Vue-директиву** — в React её эквивалента нет, все проверки идут через `<Can>` и `usePermissions()`.
- **Убираем `ROLE_HIERARCHY` и `requiredRole`** — чистая матричная модель. Если роль-иерархия понадобится — добавим утилитой в 10 строк.
- **Убираем `scope` (`own/all`)** — проверка владельца делается отдельно (`item.ownerId === user.id`), не через permission-строку.
- **Каскад сохраняем** — `rules` покрывает `rules:edit`, `*` покрывает всё.
- **Источник прав на сегодня** — клиентская матрица по `user.role`, завтра — массив `permissions` с бекенда. API потребителей (`can`, `<Can>`) не меняется.
- **Защита роутов** — `PermissionGuard`-компонент в семье существующих `AuthGuard` / `GuestGuard`; без Next.js middleware.
- **Мeny** — декларативные `permission?: Permission | Permission[]` в nav-config'ах, фильтрация хелпером `filterNavItems`.
- **Web и mobile** — зеркальное ядро (types/config/utils/hooks), дублируется вручную, синхронизация по чеклисту.

---

## 1. Сравнение с текущим состоянием show-ring

| Область | Текущее состояние | Требуется |
|---|---|---|
| Типы роли | `UserType = Record<string, any>` (`src/auth/types.ts`) | `type Role = 'admin' \| 'user' \| ...`, `type Permission = ...` |
| Матрица прав | Отсутствует | `ROLE_PERMISSIONS` в `src/config/permissions.ts` |
| Проверка прав | `RoleBasedGuard` принимает `currentRole`/`allowedRoles` пропсами извне, внутри — `allowedRoles.includes(currentRole)` | Централизованный `can(perm, userPermissions)` с каскадом |
| Контекст | `useAuthContext()` отдаёт `user` с неявным `role` | Extend: `permissions: Permission[]` computed в AuthProvider |
| Guard роута | `AuthGuard`, `GuestGuard` (только authenticated/not) | + `PermissionGuard` |
| Фильтрация меню | Нет; `nav-config-dashboard.tsx` и пр. не знают о permissions | `filterNavItems` + `permission` на item'ах |
| 403-страница | `ForbiddenIllustration` внутри `RoleBasedGuard`; нет отдельного маршрута | `/403` route + `PermissionDeniedView` из `src/sections/error/` (мобильный аналог уже есть) |
| Mobile | Есть `RoleBasedGuard`-инлайн в `src/sections/permission/view.tsx` с локальным `useState<Role>` | После реализации — переезд на `usePermissions()` |

Ключевая дельта: show-ring template — это **демо-скелет** с одним файлом `role-based-guard.tsx`, без фактической RBAC-системы. Наша задача — ввести её целиком.

---

## 2. Отклонения от исходного документа и их обоснование

### 2.1. Удаляем директиву `v-can`
React не поддерживает директивы как первоклассный примитив. Аналог — HOC или custom JSX transform, оба неоправданны. `<Can>` покрывает декларативный UX, `usePermissions()` — императивный. Точка.

### 2.2. Удаляем `ROLE_HIERARCHY` и `requiredRole`
Исходный документ в аудите сам обосновал hierarchy как утилиту для `isRoleAtLeast`. Но матрица `ROLE_PERMISSIONS` уже выражает все доступы: «admin имеет всё, что есть у viewer» — это свойство строк матрицы, а не отдельной структуры. Когда доступы конкретны — hierarchy становится concern'ом без consumer'ов:

- `requiredRole: 'admin'` → выражается через permission (например, защита через `dashboard:admin-panel`)
- «Admin или выше» в меню → `can('something:specific')` вместо `isAtLeast('admin')`
- Ортогональные роли (типа `moderator`, который не «между» viewer и admin, а сбоку) ломают идею линейного порядка — hierarchy заставляла бы искусственно размещать их по числовой шкале

Это согласуется с принципом least-assumption: матрица описывает всё, что известно о доступе, hierarchy — домысел.

### 2.3. Удаляем `scope` (`own/all`)
В реальных приложениях проверка «мой ресурс или чужой» почти всегда сводится к `resource.ownerId === currentUser.id` — информации, которая недоступна на уровне строки-permission. Трёхуровневый формат `resource:action:scope` решает гипотетический случай, когда бекенд различает «редактировать свои» и «редактировать все», но не даёт фронту механизма применить это к конкретному объекту. В итоге — либо scope игнорируется, либо дублируется логикой `isOwner`. YAGNI.

Если позже scope понадобится — формат расширяем без breaking change (`Permission` — template literal union, добавляем третью часть).

### 2.4. Источник данных — клиент сегодня, бекенд завтра
Обсуждение с командой: роли/permissions будут жить на беке, но сейчас его нет. План:

- **Сейчас:** `user.role` приходит в ответе `/me`. AuthProvider вычисляет `permissions = ROLE_PERMISSIONS[user.role]` в `useMemo`.
- **Переход:** когда бек начнёт отдавать `user.permissions`, AuthProvider переключается на `permissions = user.permissions ?? ROLE_PERMISSIONS[user.role]` (fallback). Ни один consumer (`<Can>`, `usePermissions`, `PermissionGuard`, `filterNavItems`) не меняется.
- **Финал миграции:** fallback удаляется, клиентская матрица остаётся только в тестах/моках.

Это даёт стабильный API с первого дня.

### 2.5. Guard роутов — компонент вместо middleware
Next.js middleware привлекателен (edge-level redirect до рендера), но:

- Middleware бежит на Edge Runtime → не может импортировать часть клиентского кода (разные bundling-constraints).
- Матрица пришлось бы держать в двух форматах либо использовать Edge-совместимый модуль (что влияет на структуру).
- Smart refresh-логика (permissions обновляются при refresh токена) ломается, потому что middleware видит только cookies на момент запроса.

Текущий show-ring использует паттерн `AuthGuard` в layout'ах. Добавляем `PermissionGuard` того же семейства — консистентно, без новых концептов. Короткий flash до редиректа закрывается splash-скрином (уже используется в AuthGuard).

---

## 3. Типы

**`src/types/permissions.ts`:**

```typescript
// Доменные константы — расширяем по мере развития продукта
export type Role = 'admin' | 'user';

export type Resource =
  | 'dashboard'
  | 'management'
  | 'reports';
  // ... дополняется по матрице

export type Action = 'view' | 'create' | 'edit' | 'delete';

// Template literal union: compile-time проверка опечаток
export type Permission =
  | '*'
  | Resource
  | `${Resource}:${Action}`;

export interface ParsedPermission {
  resource: string;
  action?: string;
  isWildcard: boolean;
}
```

**Обновление `src/auth/types.ts`:**

```typescript
import type { Role, Permission } from 'src/types/permissions';

export type UserType = {
  id: string;
  role: Role;
  // ... прочие поля
} | null;

export type AuthContextValue = {
  user: UserType;
  permissions: Permission[];    // ← новое, computed в провайдере
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  checkUserSession?: () => Promise<void>;
};
```

Важно: `Permission = string` в утилитах (`can`, `permissionCovers`) — template literal assignable to string, breakage нет, но call-сайты получают автокомплит.

---

## 4. Конфигурация

**`src/config/permissions.ts`:**

```typescript
import type { Role, Permission } from 'src/types/permissions';

export const DEFAULT_ROLE: Role = 'user';
export const ROLES_LIST: Role[] = ['admin', 'user'];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['*'],
  user: [
    'dashboard:view',
    'reports:view',
  ],
};
```

Стартовая матрица намеренно скромная. Расширение — в разделе «Чеклист внедрения роли/ресурса» ниже.

---

## 5. Утилиты ядра

**`src/utils/permissions.ts` (platform-agnostic, ноль React/MUI импортов):**

```typescript
import type { Permission, ParsedPermission } from 'src/types/permissions';

export function parsePermission(permission: string): ParsedPermission {
  if (permission === '*') return { resource: '*', isWildcard: true };
  const [resource, action] = permission.split(':');
  return { resource, action, isWildcard: false };
}

/**
 * Проверяет, покрывает ли permission `granted` требуемый permission `required`.
 * Каскад: `rules` покрывает `rules:edit`, `*` покрывает всё.
 */
export function permissionCovers(granted: string, required: string): boolean {
  if (granted === '*') return true;
  if (granted === required) return true;
  const g = parsePermission(granted);
  const r = parsePermission(required);
  // `rules` (без action) покрывает `rules:edit`
  if (!g.action && g.resource === r.resource) return true;
  return false;
}

export function can(required: string, granted: readonly string[]): boolean {
  return granted.some((p) => permissionCovers(p, required));
}

export function canAny(required: readonly string[], granted: readonly string[]): boolean {
  return required.some((r) => can(r, granted));
}

export function canAll(required: readonly string[], granted: readonly string[]): boolean {
  return required.every((r) => can(r, granted));
}

export function getPermissionsForRole(
  role: Role,
  matrix: Record<Role, Permission[]> = ROLE_PERMISSIONS,
): Permission[] {
  return matrix[role] ?? [];
}

export function normalizeRole(value: unknown): Role {
  return ROLES_LIST.includes(value as Role) ? (value as Role) : DEFAULT_ROLE;
}
```

**Тесты** (`src/utils/permissions.test.ts`) — юнит-тесты на каждую функцию. Особенно — каскад: `permissionCovers('rules', 'rules:edit') === true`, `permissionCovers('rules:view', 'rules:edit') === false`.

---

## 6. Интеграция с AuthContext

Доработка `src/auth/context/jwt/auth-provider.tsx` (аналогично в amplify/auth0/firebase/supabase):

```typescript
const memoizedValue = useMemo(() => {
  const role = normalizeRole(state.user?.role);
  const user = state.user ? { ...state.user, role } : null;
  const permissions = user ? getPermissionsForRole(role) : [];
  return {
    user,
    permissions,                // ← новое
    checkUserSession,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
    unauthenticated: status === 'unauthenticated',
  };
}, [checkUserSession, state.user, status]);
```

Миграция к серверу (этап 2):

```typescript
const permissions = user
  ? (state.user?.permissions as Permission[] ?? getPermissionsForRole(role))
  : [];
```

И финально (этап 3, когда бек стабилен): убираем fallback.

---

## 7. React API

**`src/hooks/use-permissions.ts`:**

```typescript
import { useMemo } from 'react';
import { useAuthContext } from 'src/auth/hooks';
import { can, canAny, canAll } from 'src/utils/permissions';
import type { Permission } from 'src/types/permissions';

export function usePermissions() {
  const { user, permissions } = useAuthContext();
  return useMemo(
    () => ({
      role: user?.role,
      permissions,
      can: (perm: Permission | string) => can(perm, permissions),
      canAny: (perms: readonly (Permission | string)[]) => canAny(perms, permissions),
      canAll: (perms: readonly (Permission | string)[]) => canAll(perms, permissions),
    }),
    [user?.role, permissions],
  );
}
```

**`src/components/can/can.tsx`:**

```typescript
'use client';
import type { ReactNode } from 'react';
import type { Permission } from 'src/types/permissions';
import { usePermissions } from 'src/hooks/use-permissions';

type Mode = 'any' | 'all';

export type CanProps = {
  permission: Permission | Permission[];
  mode?: Mode;                                // default: 'any'
  fallback?: ReactNode;
  children: ReactNode | ((ctx: { allowed: boolean }) => ReactNode);
};

export function Can({ permission, mode = 'any', fallback = null, children }: CanProps) {
  const { can, canAny, canAll } = usePermissions();
  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed =
    perms.length === 1 ? can(perms[0]) : mode === 'all' ? canAll(perms) : canAny(perms);

  if (typeof children === 'function') return <>{children({ allowed })}</>;
  return <>{allowed ? children : fallback}</>;
}
```

Примеры использования:

```tsx
<Can permission="rules:edit">
  <Button>Edit</Button>
</Can>

<Can permission={['rules:edit', 'rules:delete']} mode="any">
  <ModifyControls />
</Can>

<Can permission="rules:delete" fallback={<Button disabled>Delete</Button>}>
  <Button onClick={remove}>Delete</Button>
</Can>

<Can permission="rules:edit">
  {({ allowed }) => <Button disabled={!allowed}>Edit</Button>}
</Can>
```

**`src/auth/guard/permission-guard.tsx`:**

```typescript
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { SplashScreen } from 'src/components/loading-screen';
import { usePermissions } from 'src/hooks/use-permissions';
import type { Permission } from 'src/types/permissions';

type Props = {
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
  children: React.ReactNode;
};

export function PermissionGuard({ permission, mode = 'any', children }: Props) {
  const router = useRouter();
  const { can, canAny, canAll, permissions } = usePermissions();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const perms = Array.isArray(permission) ? permission : [permission];
    const allowed =
      perms.length === 1 ? can(perms[0]) : mode === 'all' ? canAll(perms) : canAny(perms);
    if (!allowed) router.replace(paths.page403);
    else setIsChecking(false);
  }, [permissions, permission, mode]);  // deps не включают can/canAny/canAll (стабильны через useMemo)

  if (isChecking) return <SplashScreen />;
  return <>{children}</>;
}
```

Использование в layout:

```tsx
// src/app/dashboard/management/layout.tsx
export default function Layout({ children }) {
  return <PermissionGuard permission="management:view">{children}</PermissionGuard>;
}
```

**Депрекация `RoleBasedGuard`:**
1. Оставляем файл `src/auth/guard/role-based-guard.tsx` с `@deprecated` JSDoc и комментарием «use <Can hasContent /> or PermissionGuard».
2. После прохода по всем call-сайтам (в шаблоне их мало) — удаляем в отдельном коммите.

---

## 8. Фильтрация меню

Доработка типов в nav-config:

```typescript
// src/layouts/types.ts (или аналог)
export type NavItemBase = {
  title: string;
  path: string;
  icon?: ReactNode;
  permission?: Permission | Permission[];   // ← новое
  permissionMode?: 'any' | 'all';           // ← новое
  children?: NavItemBase[];
};
```

Хелпер:

```typescript
// src/layouts/nav-filter.ts
export function filterNavItems<T extends NavItemBase>(
  items: readonly T[],
  check: (perm: Permission | Permission[], mode?: 'any' | 'all') => boolean,
): T[] {
  return items
    .filter((item) => !item.permission || check(item.permission, item.permissionMode))
    .map((item) => ({
      ...item,
      children: item.children ? filterNavItems(item.children, check) : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0);
}
```

Использование (в `DashboardLayout` или где формируется nav):

```tsx
const { can, canAny, canAll } = usePermissions();
const filtered = useMemo(
  () => filterNavItems(navConfig, (p, m) => {
    const arr = Array.isArray(p) ? p : [p];
    return arr.length === 1 ? can(arr[0]) : m === 'all' ? canAll(arr) : canAny(arr);
  }),
  [navConfig, can, canAny, canAll],
);
```

---

## 9. 403-страница

- Route: `src/app/403/page.tsx` → рендерит `<View403 />`.
- `View403` — уже существующий шаблон `src/sections/error/` (в web; на мобиле — `src/sections/permission/view.tsx` уже портирован).
- `paths.page403 = '/403'` — добавить в `src/routes/paths.ts` если нет.

---

## 10. Структура файлов — финальный список

**Web (`show-ring/src/`):**

```
types/permissions.ts                   [НОВЫЙ]
config/permissions.ts                  [НОВЫЙ]
utils/permissions.ts                   [НОВЫЙ]
utils/permissions.test.ts              [НОВЫЙ]
hooks/use-permissions.ts               [НОВЫЙ]
components/can/can.tsx                 [НОВЫЙ]
components/can/index.ts                [НОВЫЙ]
auth/guard/permission-guard.tsx        [НОВЫЙ]
auth/guard/index.ts                    [ПРАВКА — export permission-guard, deprecate role-based-guard]
auth/guard/role-based-guard.tsx        [ПРАВКА — @deprecated JSDoc]
auth/types.ts                          [ПРАВКА — типизировать UserType, добавить permissions]
auth/context/jwt/auth-provider.tsx     [ПРАВКА — computed permissions]
auth/context/amplify/auth-provider.tsx [ПРАВКА — то же]
auth/context/auth0/auth-provider.tsx   [ПРАВКА — то же]
auth/context/firebase/auth-provider.tsx[ПРАВКА — то же]
auth/context/supabase/auth-provider.tsx[ПРАВКА — то же]
layouts/types.ts                       [ПРАВКА — permission?: на NavItem]
layouts/nav-filter.ts                  [НОВЫЙ]
app/403/page.tsx                       [НОВЫЙ — если не было]
routes/paths.ts                        [ПРАВКА — page403]
```

**Mobile (`show-ring-mobile/src/`):** зеркально — те же файлы из `types/`, `config/`, `utils/`, `hooks/`. `components/can/can.tsx` переписывается для RN (без MUI, `<View>` из react-native). `PermissionGuard` — аналогично с `expo-router`'s `router.replace`.

---

## 11. План работ

### Фаза 1 — Web, ядро RBAC (один PR)

1. `types/permissions.ts` — типы.
2. `config/permissions.ts` — стартовая матрица.
3. `utils/permissions.ts` + юнит-тесты.
4. `auth/types.ts` — типизация, `permissions: Permission[]` в контексте.
5. AuthProvider'ы (все 5 контекстов) — computed permissions.
6. `hooks/use-permissions.ts`.
7. `components/can/`.
8. `auth/guard/permission-guard.tsx` + `index.ts`.
9. `app/403/page.tsx` + `paths.page403`.
10. Помечаем `RoleBasedGuard` как `@deprecated`.

**Критерий готовности:** `npm run check:all` зелёный, юнит-тесты `utils/permissions` проходят, `<Can permission="*">` рендерит children для любого залогиненного, `<Can permission="admin:only">` скрывает.

### Фаза 2 — Web, меню и guards на реальных роутах (второй PR)

1. `layouts/types.ts` — `permission?:` на NavItem.
2. `layouts/nav-filter.ts` + тесты.
3. Проставляем `permission` на пунктах `nav-config-dashboard.tsx` (и других nav-config'ах — по мере обнаружения защищённых секций).
4. Заворачиваем `app/dashboard/*/layout.tsx` в `PermissionGuard` там, где это уместно.
5. Удаляем `RoleBasedGuard` (один коммит «rbac: drop deprecated RoleBasedGuard»).

### Фаза 3 — Mobile зеркало (отдельный PR в `show-ring-mobile`)

1. Копия `types/permissions.ts`, `config/permissions.ts`, `utils/permissions.ts`.
2. `hooks/use-permissions.ts` — идентично.
3. RN-`<Can>` (минимально — `{allowed ? children : fallback}` с рендер-пропсом).
4. `PermissionGuard` на expo-router.
5. Рефактор `src/sections/permission/view.tsx`: выпиливаем локальный `useState<Role>`, используем `usePermissions()`.
6. 403 уже есть (`PermissionDeniedView`) — подключить как route-guard fallback.

### Фаза 4 — Миграция к серверной матрице (когда появится бек)

1. Бек начинает отдавать `user.permissions: Permission[]` в `/me`.
2. В AuthProvider: `permissions = user.permissions ?? getPermissionsForRole(role)` (fallback для старых токенов).
3. Тестируем на staging.
4. Когда все клиенты обновились — убираем fallback, клиентская матрица остаётся только в юнит-тестах/моках.

---

## 12. Синхронизация между web и mobile

Оба репо держат собственную копию ядра. Поскольку монорепо нет, а приватный npm-пакет избыточен для текущего объёма, синхронизация — через чеклист:

**При изменении `ROLE_PERMISSIONS` / типов / утилит:**
1. Меняем в `show-ring` (web — источник правды).
2. Копируем 1-в-1 в `show-ring-mobile`.
3. В коммит-сообщении префикс `rbac:` в обоих репо.
4. В PR-описании ссылка на parent-PR.

Файлы-кандидаты на копирование:
- `src/types/permissions.ts` — 100% shared
- `src/config/permissions.ts` — 100% shared
- `src/utils/permissions.ts` — 100% shared
- `src/hooks/use-permissions.ts` — 100% shared (`useAuthContext` API совпадает на обоих стеках)

**НЕ копируются** (platform-specific):
- `components/can/can.tsx` — web уровень на React DOM, mobile на RN.
- `auth/guard/permission-guard.tsx` — web использует `next/navigation`, mobile — `expo-router`.

Когда дублируемого кода станет ≥ 5 файлов / 500 строк — заводим приватный пакет `@show-ring/rbac` или объединяем в монорепо (вне скоупа этого документа).

---

## 13. Расширение системы

### Добавление новой роли

1. `src/types/permissions.ts`: расширить `Role`.
2. `src/config/permissions.ts`: добавить в `ROLE_PERMISSIONS` и `ROLES_LIST`.
3. Копия в mobile.

### Добавление нового ресурса

1. `src/types/permissions.ts`: расширить `Resource`.
2. `src/config/permissions.ts`: проставить в матрице для всех ролей.
3. Nav-item: `permission: 'newResource:view'`.
4. Layout: `<PermissionGuard permission="newResource:view">`.
5. Копия в mobile.

### Если позже понадобится scope

`Permission` — template literal, добавляем третью часть:

```typescript
type Scope = 'own' | 'all';
type Permission = '*' | Resource | `${Resource}:${Action}` | `${Resource}:${Action}:${Scope}`;
```

`permissionCovers` расширяется: без scope в granted → покрывает любой scope.

### Если позже понадобится иерархия

Добавить утилиту:

```typescript
// src/utils/permissions.ts
const ROLE_ORDER: Role[] = ['user', 'admin'];
export function isRoleAtLeast(current: Role, required: Role): boolean {
  return ROLE_ORDER.indexOf(current) >= ROLE_ORDER.indexOf(required);
}
```

Без изменений матрицы. Вводить только при появлении конкретного consumer'а.

---

## 14. FAQ

**Q: Почему не middleware для гардов?**
A: Edge Runtime ограничивает импорты, рантайм-обновление прав (refresh токена) усложняется, текущий проект уже использует `*Guard`-компоненты. Консистентность важнее микрооптимизации первого рендера.

**Q: Как тестировать разные роли локально?**
A: DevTools → `sessionStorage` / React DevTools context → меняем `user.role` вручную. Для E2E — фикстура пользователя с нужной ролью на staging.

**Q: Что если backend вернёт неизвестную роль?**
A: `normalizeRole()` сваливает к `DEFAULT_ROLE` (`user`). Это защита от опечатки/рассинхрона, не от вредоносного клиента — тот видит только то, что сервер вернёт в ответах API.

**Q: Почему `Permission` в утилитах принимает `string`, а не `Permission`?**
A: Template literal Permission assignable to string. Call-сайты из TypeScript кода получают автокомплит (`can('rules:edit')` → подсказка). Утилиты принимают `string` чтобы не навязывать тип при миграциях / рантайм-данных.

**Q: Почему иерархия не нужна, если админ «больше» юзера?**
A: «Больше» — это свойство строк матрицы, а не отдельной структуры. `ROLE_PERMISSIONS.admin` содержит всё, что есть в `ROLE_PERMISSIONS.user` — значит админ фактически покрывает юзера. Отдельный `ROLE_HIERARCHY` дублирует эту информацию и создаёт возможность рассинхрона.

---

## 15. Чеклист реализации (копировать в PR-описание Фазы 1)

- [x] `src/types/permissions.ts`
- [x] `src/config/permissions.ts`
- [x] `src/utils/permissions.ts` (тесты — TODO)
- [x] `src/auth/types.ts` — типизация
- [x] AuthProvider (jwt / amplify / auth0 / firebase / supabase) — computed permissions
- [x] `src/hooks/use-permissions.ts`
- [x] `src/components/can/`
- [x] `src/auth/guard/permission-guard.tsx` + обновлённый index
- [x] `@deprecated` на `RoleBasedGuard`
- [x] `src/app/403/page.tsx` + `paths.page403` (уже существовали)
- [ ] `npm run check:all` зелёный
