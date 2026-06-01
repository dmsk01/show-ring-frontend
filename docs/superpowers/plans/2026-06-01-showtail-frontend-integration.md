# ShowTail Frontend Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Minimal Kit frontend to the live ShowTail FastAPI backend (proxy + real JWT auth with refresh + RBAC for 6 roles) and ship the **Dogs** domain as the reference vertical slice.

**Architecture:** Next.js `rewrites()` proxies `/api/*` → `http://localhost:8000/*` (single origin, no CORS). axios uses `baseURL='/api'` with a request interceptor (bearer) and a response interceptor (401 → `/auth/refresh` → retry). Auth context reads `GET /users/me` (`roles: [{role}]`, multi-role) and resolves a unioned permission set consumed by the existing `can/canAny/canAll` engine. The Dogs domain follows the existing `user` section + `product` SWR-action patterns: types → SWR actions → sections → routes → RBAC.

**Tech Stack:** Next.js 16 (App Router), React 19, MUI 7, TypeScript, SWR, axios, react-hook-form + zod, vitest (added here for pure-logic unit tests).

**Conventions for every task:**
- Typecheck: `npx tsc --noEmit` — expected: no errors.
- Lint: `npm run lint` — expected: no errors in touched files.
- Backend must be running (`http://localhost:8000`, Swagger at `/docs`). Dev server: `npm run dev` → `http://localhost:8082`.
- `POST /auth/login` is rate-limited **5/min per IP** — don't spam it during manual checks.
- Dev admin: `admin@admin.com` / `Password123!`.
- Reference spec: `docs/superpowers/specs/2026-06-01-showtail-frontend-integration-design.md`.

---

## PHASE A — Foundation

### Task A1: Test runner (vitest) for pure-logic units

**Files:**
- Modify: `package.json` (devDependencies + `test` script)
- Create: `vitest.config.ts`
- Create: `src/utils/__tests__/smoke.test.ts`

- [ ] **Step 1: Install vitest**

Run: `npm i -D vitest@^2.1.0`
Expected: added to `devDependencies`.

- [ ] **Step 2: Add test script** in `package.json` `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { src: path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create smoke test** `src/utils/__tests__/smoke.test.ts`

```ts
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/utils/__tests__/smoke.test.ts
git commit -m "chore: add vitest for pure-logic unit tests"
```

---

### Task A2: Next.js rewrites proxy + `.env`

**Files:**
- Modify: `next.config.ts`
- Create: `.env` (gitignored)
- Create: `.env.example` (committed)

- [ ] **Step 1: Add `rewrites()` to `next.config.ts`** inside `nextConfig` object (alongside `webpack`/`turbopack`):

```ts
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/:path*`,
      },
    ];
  },
```

- [ ] **Step 2: Create `.env`** (already covered by `.gitignore`):

```
NEXT_PUBLIC_SERVER_URL=/api
BACKEND_URL=http://localhost:8000
# Dev admin created via backend scripts.bootstrap_admin (for manual testing only)
DEV_ADMIN_EMAIL=admin@admin.com
DEV_ADMIN_PASSWORD=Password123!
```

- [ ] **Step 3: Create `.env.example`** (committed, no secrets):

```
NEXT_PUBLIC_SERVER_URL=/api
BACKEND_URL=http://localhost:8000
DEV_ADMIN_EMAIL=
DEV_ADMIN_PASSWORD=
```

- [ ] **Step 4: Verify `.env` is ignored**

Run: `git status --short`
Expected: `.env` does NOT appear; `.env.example` and `next.config.ts` do.

- [ ] **Step 5: Verify proxy works** (backend running). Start dev server (`npm run dev`), then:

Run: `curl -s -o NUL -w "%{http_code}" http://localhost:8082/api/health/`
Expected: `200` (proxied to backend `/health/`). Stop the dev server after.

- [ ] **Step 6: Commit**

```bash
git add next.config.ts .env.example
git commit -m "feat: proxy /api to ShowTail backend via Next.js rewrites"
```

---

### Task A3: RBAC types + config for the 6 backend roles

**Files:**
- Modify: `src/types/permissions.ts`
- Modify: `src/config/permissions.ts`
- Test: `src/config/__tests__/permissions.test.ts`

- [ ] **Step 1: Replace `src/types/permissions.ts`** with the real role/resource model:

```ts
// Доменные константы — расширяем по мере развития продукта.
// Роли соответствуют RoleEnum бэкенда ShowTail.
export type Role = 'admin' | 'organizer' | 'breeder' | 'judge' | 'buyer' | 'operator';

export type Resource =
  | 'dashboard'
  | 'dogs'
  | 'kennels'
  | 'litters'
  | 'classifieds'
  | 'shows'
  | 'results'
  | 'references'
  | 'ads'
  | 'support'
  | 'admin';

export type Action = 'view' | 'create' | 'edit' | 'delete';

// Template literal union: compile-time проверка опечаток
export type Permission = '*' | Resource | `${Resource}:${Action}`;

export interface ParsedPermission {
  resource: string;
  action?: string;
  isWildcard: boolean;
}
```

- [ ] **Step 2: Write failing test** `src/config/__tests__/permissions.test.ts`

```ts
import { describe, it, expect } from 'vitest';

import { ROLES_LIST, DEFAULT_ROLE, ROLE_PERMISSIONS } from 'src/config/permissions';

describe('RBAC config', () => {
  it('lists the 6 backend roles', () => {
    expect([...ROLES_LIST].sort()).toEqual(
      ['admin', 'breeder', 'buyer', 'judge', 'operator', 'organizer'].sort()
    );
  });

  it('defaults to the least-privileged role', () => {
    expect(DEFAULT_ROLE).toBe('buyer');
  });

  it('grants admin the wildcard', () => {
    expect(ROLE_PERMISSIONS.admin).toContain('*');
  });

  it('lets breeders manage dogs but not shows', () => {
    expect(ROLE_PERMISSIONS.breeder).toContain('dogs');
    expect(ROLE_PERMISSIONS.breeder).not.toContain('shows');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/config/__tests__/permissions.test.ts`
Expected: FAIL (current config has roles `['admin','user']`, `DEFAULT_ROLE='user'`).

- [ ] **Step 4: Replace `src/config/permissions.ts`**

```ts
import type { Role, Permission } from 'src/types/permissions';

// ----------------------------------------------------------------------

export const DEFAULT_ROLE: Role = 'buyer';

export const ROLES_LIST: Role[] = ['admin', 'organizer', 'breeder', 'judge', 'buyer', 'operator'];

// Стартовая матрица прав. Расширяется по мере добавления доменов.
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['*'],
  organizer: ['dashboard:view', 'shows', 'results', 'references:view', 'ads'],
  breeder: ['dashboard:view', 'dogs', 'kennels', 'litters', 'classifieds', 'shows:view', 'references:view'],
  judge: ['dashboard:view', 'shows:view', 'results:create', 'results:edit', 'references:view'],
  buyer: ['dashboard:view', 'classifieds:view', 'dogs:view', 'references:view'],
  operator: ['dashboard:view', 'support', 'classifieds:view', 'references:view'],
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/config/__tests__/permissions.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Typecheck** (catches any place still referencing role `'user'`)

Run: `npx tsc --noEmit`
Expected: errors ONLY in `src/auth/context/jwt/auth-provider.tsx` / `src/hooks/use-permissions.ts` if they reference single role — those are fixed in A4/A5. If errors appear elsewhere (e.g. mock data), note them; fix obvious role references to a valid role.

- [ ] **Step 7: Commit**

```bash
git add src/types/permissions.ts src/config/permissions.ts src/config/__tests__/permissions.test.ts
git commit -m "feat: RBAC roles + permission matrix for the 6 ShowTail roles"
```

---

### Task A4: Multi-role permission resolution

**Files:**
- Modify: `src/utils/permissions.ts` (add `getPermissionsForRoles`, `normalizeRoles`)
- Test: `src/utils/__tests__/permissions.test.ts`

- [ ] **Step 1: Write failing test** `src/utils/__tests__/permissions.test.ts`

```ts
import { describe, it, expect } from 'vitest';

import { normalizeRoles, getPermissionsForRoles } from 'src/utils/permissions';

describe('multi-role resolution', () => {
  it('normalizes API role objects to a Role[]', () => {
    expect(normalizeRoles([{ role: 'admin' }, { role: 'breeder' }])).toEqual(['admin', 'breeder']);
  });

  it('drops unknown roles', () => {
    expect(normalizeRoles([{ role: 'wizard' }, { role: 'judge' }])).toEqual(['judge']);
  });

  it('falls back to the default role when empty', () => {
    expect(normalizeRoles([])).toEqual(['buyer']);
  });

  it('accepts bare string roles too', () => {
    expect(normalizeRoles(['organizer'])).toEqual(['organizer']);
  });

  it('unions and dedupes permissions across roles', () => {
    const perms = getPermissionsForRoles(['breeder', 'judge']);
    expect(perms).toContain('dogs');
    expect(perms).toContain('results:create');
    expect(perms.filter((p) => p === 'dashboard:view')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/__tests__/permissions.test.ts`
Expected: FAIL ("normalizeRoles is not exported" / not a function).

- [ ] **Step 3: Add to `src/utils/permissions.ts`** (keep existing exports; append these). Note the existing file already imports `ROLES_LIST, DEFAULT_ROLE, ROLE_PERMISSIONS` and exports `normalizeRole`/`getPermissionsForRole`:

```ts
type ApiRole = string | { role?: string };

/** Maps `/users/me` roles ([{role}]) or bare strings to known Role[]; falls back to [DEFAULT_ROLE]. */
export function normalizeRoles(value: readonly ApiRole[] | null | undefined): Role[] {
  const raw = (value ?? [])
    .map((r) => (typeof r === 'string' ? r : r?.role))
    .filter((r): r is string => Boolean(r));

  const known = raw.filter((r): r is Role => ROLES_LIST.includes(r as Role));

  return known.length ? known : [DEFAULT_ROLE];
}

/** Union (deduped) of permissions across all given roles. */
export function getPermissionsForRoles(
  roles: readonly Role[],
  matrix: Record<Role, Permission[]> = ROLE_PERMISSIONS
): Permission[] {
  const set = new Set<Permission>();
  roles.forEach((role) => (matrix[role] ?? []).forEach((p) => set.add(p)));
  return [...set];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/__tests__/permissions.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/permissions.ts src/utils/__tests__/permissions.test.ts
git commit -m "feat: multi-role permission union for /users/me roles[]"
```

---

### Task A5: Auth types + context for multi-role

**Files:**
- Modify: `src/auth/types.ts`
- Modify: `src/hooks/use-permissions.ts`

- [ ] **Step 1: Replace `src/auth/types.ts`** to carry `roles`:

```ts
import type { Role } from 'src/types/permissions';

export type UserType = Record<string, any> | null;

export type AuthState = {
  user: UserType;
  loading: boolean;
};

export type AuthContextValue = {
  user: UserType;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  roles: Role[];
  permissions: string[];
  checkUserSession?: () => Promise<void>;
};
```

- [ ] **Step 2: Update `src/hooks/use-permissions.ts`** to expose `roles` (array) instead of single `role`:

```ts
'use client';

import type { Permission } from 'src/types/permissions';

import { useMemo } from 'react';

import { can, canAny, canAll } from 'src/utils/permissions';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function usePermissions() {
  const { roles, permissions } = useAuthContext();

  return useMemo(
    () => ({
      roles,
      permissions,
      can: (perm: Permission | string) => can(perm, permissions),
      canAny: (perms: readonly (Permission | string)[]) => canAny(perms, permissions),
      canAll: (perms: readonly (Permission | string)[]) => canAll(perms, permissions),
    }),
    [roles, permissions]
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors now point to `src/auth/context/jwt/auth-provider.tsx` (must provide `roles`) — fixed in A7. No other new errors.

- [ ] **Step 4: Commit**

```bash
git add src/auth/types.ts src/hooks/use-permissions.ts
git commit -m "feat: carry roles[] through auth context and usePermissions"
```

---

### Task A6: axios endpoints + auth interceptors (bearer + 401 refresh)

**Files:**
- Modify: `src/lib/axios.ts`
- Modify: `src/auth/context/jwt/constant.ts`

- [ ] **Step 1: Add refresh-token storage key** to `src/auth/context/jwt/constant.ts`:

```ts
// ----------------------------------------------------------------------

export const JWT_STORAGE_KEY = 'jwt_access_token';
export const JWT_REFRESH_STORAGE_KEY = 'jwt_refresh_token';
```

- [ ] **Step 2: Replace `src/lib/axios.ts`** with backend endpoints + interceptors:

```ts
import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

import { JWT_STORAGE_KEY, JWT_REFRESH_STORAGE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl, // '/api' → proxied to backend by Next.js rewrites
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer on every request (survives token refresh, unlike axios.defaults).
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem(JWT_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On 401: try refresh once, then retry the original request.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken =
    typeof window !== 'undefined' ? sessionStorage.getItem(JWT_REFRESH_STORAGE_KEY) : null;
  if (!refreshToken) return null;

  try {
    const res = await axios.post(`${CONFIG.serverUrl}${endpoints.auth.refresh}`, {
      refresh_token: refreshToken,
    });
    const { access_token, refresh_token } = res.data;
    sessionStorage.setItem(JWT_STORAGE_KEY, access_token);
    if (refresh_token) sessionStorage.setItem(JWT_REFRESH_STORAGE_KEY, refresh_token);
    return access_token;
  } catch {
    sessionStorage.removeItem(JWT_STORAGE_KEY);
    sessionStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
    return null;
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error?.response?.status;

    const isAuthCall = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return axiosInstance(original);
      }
    }

    const message =
      error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Something went wrong!';
    return Promise.reject(new Error(typeof message === 'string' ? message : 'Request failed'));
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async <T = unknown>(
  args: string | [string, AxiosRequestConfig]
): Promise<T> => {
  const [url, config] = Array.isArray(args) ? args : [args, {}];
  const res = await axiosInstance.get<T>(url, config);
  return res.data;
};

// ----------------------------------------------------------------------

export const endpoints = {
  // --- ShowTail backend ---
  auth: {
    me: '/users/me',
    profile: '/users/me/profile',
    signIn: '/auth/login',
    signUp: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  dog: {
    list: '/dogs',
    details: (id: string) => `/dogs/${id}`,
    pedigree: (id: string) => `/dogs/${id}/pedigree`,
    titles: (id: string) => `/dogs/${id}/titles`,
  },
  reference: {
    breeds: '/references/breeds',
    kennels: '/kennels',
  },
  // --- Minimal Kit demo endpoints (parked per spec §4; kept so demo actions keep compiling) ---
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
} as const;
```

> Note: the only behavioral change to `endpoints` is the **`auth` group** (now points at the real backend). The demo groups (`chat/kanban/calendar/mail/post/product`) are kept verbatim so parked demo actions keep compiling — per spec §4 we park, not delete.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors limited to `auth-provider.tsx`/`action.ts` (fixed in A7) and any file reading the old `endpoints.auth.me` shape. No demo-action breakage (their keys are preserved).

- [ ] **Step 4: Commit**

```bash
git add src/lib/axios.ts src/auth/context/jwt/constant.ts
git commit -m "feat: point axios at backend endpoints + bearer/refresh interceptors"
```

---

### Task A7: JWT actions + auth provider against the real API

**Files:**
- Modify: `src/auth/context/jwt/action.ts`
- Modify: `src/auth/context/jwt/utils.ts`
- Modify: `src/auth/context/jwt/auth-provider.tsx`

- [ ] **Step 1: Replace `src/auth/context/jwt/action.ts`** (map snake_case tokens, store both, real register/logout):

```ts
'use client';

import axios, { endpoints } from 'src/lib/axios';

import { setSession } from './utils';
import { JWT_STORAGE_KEY, JWT_REFRESH_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export type SignInParams = { email: string; password: string };
export type SignUpParams = { email: string; password: string };

function storeTokens(data: { access_token?: string; refresh_token?: string }) {
  const { access_token, refresh_token } = data;
  if (!access_token) throw new Error('Access token not found in response');
  setSession(access_token);
  if (refresh_token) sessionStorage.setItem(JWT_REFRESH_STORAGE_KEY, refresh_token);
}

/** Sign in — POST /auth/login → { access_token, refresh_token, token_type } */
export const signInWithPassword = async ({ email, password }: SignInParams): Promise<void> => {
  const res = await axios.post(endpoints.auth.signIn, { email, password });
  storeTokens(res.data);
};

/** Sign up — POST /auth/register (same token shape) */
export const signUp = async ({ email, password }: SignUpParams): Promise<void> => {
  const res = await axios.post(endpoints.auth.signUp, { email, password });
  storeTokens(res.data);
};

/** Sign out — best-effort backend logout, then clear local session */
export const signOut = async (): Promise<void> => {
  try {
    await axios.post(endpoints.auth.logout);
  } catch {
    // ignore network/401 on logout
  } finally {
    setSession(null);
    sessionStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
  }
};
```

- [ ] **Step 2: Replace `src/auth/context/jwt/utils.ts`** — keep `jwtDecode`/`isValidToken`; simplify `setSession` (no alert timer — short-lived tokens are refreshed by the axios interceptor):

```ts
import axios from 'src/lib/axios';

import { JWT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export function jwtDecode(token: string) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) throw new Error('Invalid token!');
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken: string) {
  if (!accessToken) return false;
  const decoded = jwtDecode(accessToken);
  if (!decoded || !('exp' in decoded)) return false;
  return decoded.exp > Date.now() / 1000;
}

// ----------------------------------------------------------------------

export function setSession(accessToken: string | null) {
  if (accessToken) {
    sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    sessionStorage.removeItem(JWT_STORAGE_KEY);
    delete axios.defaults.headers.common.Authorization;
  }
}
```

> Removes `tokenExpired` (alert-based) and the `paths` import. If anything imports `tokenExpired`, remove that import — it is intentionally gone.

- [ ] **Step 3: Replace `src/auth/context/jwt/auth-provider.tsx`** — fetch `/users/me`, resolve roles+permissions. On expired access token, DON'T bail: let `/users/me` 401 trigger the interceptor refresh:

```tsx
'use client';

import type { AuthState } from '../../types';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import { normalizeRoles, getPermissionsForRoles } from 'src/utils/permissions';

import axios, { endpoints } from 'src/lib/axios';

import { JWT_STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';
import { setSession } from './utils';

// ----------------------------------------------------------------------

type Props = { children: React.ReactNode };

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);

      if (!accessToken) {
        setState({ user: null, loading: false });
        return;
      }

      setSession(accessToken);
      // /users/me; if access token is expired the response interceptor refreshes once.
      const res = await axios.get(endpoints.auth.me);
      const user = res.data;

      setState({ user: { ...user, accessToken }, loading: false });
    } catch (error) {
      console.error(error);
      setSession(null);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';
  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(() => {
    const roles = normalizeRoles(state.user?.roles);
    const permissions = state.user ? getPermissionsForRoles(roles) : [];

    return {
      user: state.user,
      roles: state.user ? roles : [],
      permissions,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    };
  }, [checkUserSession, state.user, status]);

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
```

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors in the auth files.

- [ ] **Step 5: Manual verification** (backend running, `npm run dev`):
  1. Open `http://localhost:8082`, go to JWT sign-in (`/auth/jwt/sign-in`).
  2. Enter `admin@admin.com` / `Password123!` → sign in succeeds, lands on dashboard.
  3. DevTools → Application → Session Storage: `jwt_access_token` AND `jwt_refresh_token` present.
  4. DevTools → Network: `GET /api/users/me` returns 200 with `roles: [{role:"admin"}]`.
  5. Reload page → stays authenticated.

- [ ] **Step 6: Commit**

```bash
git add src/auth/context/jwt/action.ts src/auth/context/jwt/utils.ts src/auth/context/jwt/auth-provider.tsx
git commit -m "feat: real JWT auth against ShowTail (/auth/login, /users/me, refresh)"
```

---

### Task A8: Update the JWT sign-in view default credentials

**Files:**
- Modify: `src/auth/view/jwt/jwt-sign-in-view.tsx`

- [ ] **Step 1: Update `defaultValues` and the info alert** in `jwt-sign-in-view.tsx`:

```tsx
  const defaultValues: SignInSchemaType = {
    email: 'admin@admin.com',
    password: 'Password123!',
  };
```

The `<Alert severity="info">` block already renders `defaultValues.email`/`.password` — no further change needed.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/auth/view/jwt/jwt-sign-in-view.tsx
git commit -m "chore: default sign-in to the dev admin account"
```

---

## PHASE B — Dogs vertical slice

### Task B1: Dog domain types

**Files:**
- Create: `src/types/dog.ts`

- [ ] **Step 1: Create `src/types/dog.ts`** from the verified backend schema:

```ts
export type DogSex = 'male' | 'female';

export type IDogItem = {
  id: string;
  name: string;
  sex: DogSex;
  breed_id: string;
  kennel_id: string | null;
  date_of_birth: string | null;
  color: string | null;
  rkf_number: string | null;
  tattoo: string | null;
  microchip: string | null;
  father_id: string | null;
  mother_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type IDogCreate = {
  name: string;
  sex: DogSex;
  breed_id: string;
  kennel_id?: string | null;
  date_of_birth?: string | null;
  color?: string | null;
  rkf_number?: string | null;
  tattoo?: string | null;
  microchip?: string | null;
  father_id?: string | null;
  mother_id?: string | null;
  description?: string | null;
};

export type IDogUpdate = Partial<IDogCreate>;

export type IDogPage = {
  items: IDogItem[];
  total: number;
  page: number;
  per_page: number;
};

export type IDogTitle = {
  id: string;
  dog_id: string;
  title_id: string;
  show_id: string;
  judge_id: string | null;
  date_earned: string;
};

export type IDogTableFilters = {
  search: string;
  breed_id: string;
  kennel_id: string;
  sex: DogSex | 'all';
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/dog.ts
git commit -m "feat: Dog domain types from backend schema"
```

---

### Task B2: Dogs data layer (SWR + mutations)

**Files:**
- Create: `src/actions/dog.ts`

- [ ] **Step 1: Create `src/actions/dog.ts`** following the `product.ts` SWR pattern:

```ts
import type { SWRConfiguration } from 'swr';
import type { IDogPage, IDogItem, IDogTitle, IDogCreate, IDogUpdate } from 'src/types/dog';

import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export type DogsQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  breed_id?: string;
  kennel_id?: string;
  sex?: string;
};

// ----------------------------------------------------------------------

export function useGetDogs(query: DogsQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all')
  );
  const key: [string, { params: Record<string, unknown> }] = [endpoints.dog.list, { params }];

  const { data, isLoading, error, isValidating } = useSWR<IDogPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      dogs: data?.items ?? [],
      dogsTotal: data?.total ?? 0,
      dogsLoading: isLoading,
      dogsError: error,
      dogsValidating: isValidating,
      dogsEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export function useGetDog(dogId?: string) {
  const key = dogId ? endpoints.dog.details(dogId) : null;

  const { data, isLoading, error, isValidating } = useSWR<IDogItem>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ dog: data, dogLoading: isLoading, dogError: error, dogValidating: isValidating }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export function useGetDogTitles(dogId?: string) {
  const key = dogId ? endpoints.dog.titles(dogId) : null;

  const { data, isLoading, error } = useSWR<IDogTitle[]>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ titles: data ?? [], titlesLoading: isLoading, titlesError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

export function useGetDogPedigree(dogId?: string) {
  const key = dogId ? endpoints.dog.pedigree(dogId) : null;

  const { data, isLoading, error } = useSWR<unknown>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ pedigree: data, pedigreeLoading: isLoading, pedigreeError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

export async function createDog(payload: IDogCreate): Promise<IDogItem> {
  const res = await axios.post<IDogItem>(endpoints.dog.list, payload);
  await mutate((key) => Array.isArray(key) && key[0] === endpoints.dog.list);
  return res.data;
}

export async function updateDog(dogId: string, payload: IDogUpdate): Promise<IDogItem> {
  const res = await axios.put<IDogItem>(endpoints.dog.details(dogId), payload);
  await mutate(endpoints.dog.details(dogId));
  await mutate((key) => Array.isArray(key) && key[0] === endpoints.dog.list);
  return res.data;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/actions/dog.ts
git commit -m "feat: Dogs SWR data layer (list/detail/titles/pedigree + create/update)"
```

---

### Task B3: Routes (paths) + nav entry

**Files:**
- Modify: `src/routes/paths.ts`
- Modify: `src/layouts/nav-config-dashboard.tsx`

- [ ] **Step 1: Add `dogs` to `paths.dashboard`** in `src/routes/paths.ts` (after the `user` block, before `product`):

```ts
    dogs: {
      root: `${ROOTS.DASHBOARD}/dogs`,
      new: `${ROOTS.DASHBOARD}/dogs/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/dogs/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/dogs/${id}/edit`,
    },
```

- [ ] **Step 2: Add a "ShowTail" nav section** to `navData` in `src/layouts/nav-config-dashboard.tsx` (insert as the first item of the `Management` section's `items`, or a new section directly after `Overview`):

```tsx
  {
    subheader: 'ShowTail',
    items: [
      {
        title: 'Dogs',
        path: paths.dashboard.dogs.root,
        icon: ICONS.product,
        children: [
          { title: 'List', path: paths.dashboard.dogs.root },
          { title: 'Create', path: paths.dashboard.dogs.new },
        ],
      },
    ],
  },
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/paths.ts src/layouts/nav-config-dashboard.tsx
git commit -m "feat: Dogs routes + dashboard nav entry"
```

---

### Task B4: Dogs table row + toolbar + filters-result

**Files:**
- Create: `src/sections/dog/dog-table-row.tsx`
- Create: `src/sections/dog/dog-table-toolbar.tsx`
- Create: `src/sections/dog/dog-table-filters-result.tsx`

- [ ] **Step 1: Create `src/sections/dog/dog-table-row.tsx`**

```tsx
import type { IDogItem } from 'src/types/dog';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IDogItem;
  detailsHref: string;
  editHref: string;
};

export function DogTableRow({ row, detailsHref, editHref }: Props) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Link component={RouterLink} href={detailsHref} color="inherit" sx={{ fontWeight: 600 }}>
            {row.name}
          </Link>
        </TableCell>

        <TableCell>
          <Label color={row.sex === 'male' ? 'info' : 'secondary'}>{row.sex}</Label>
        </TableCell>

        <TableCell>{row.rkf_number ?? '—'}</TableCell>
        <TableCell>{row.date_of_birth ?? '—'}</TableCell>
        <TableCell>{row.color ?? '—'}</TableCell>

        <TableCell align="right">
          <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover open={menuActions.open} anchorEl={menuActions.anchorEl} onClose={menuActions.onClose}>
        <MenuList>
          <li>
            <MenuItem component={RouterLink} href={detailsHref} onClick={menuActions.onClose}>
              <Iconify icon="solar:eye-bold" />
              View
            </MenuItem>
          </li>
          <li>
            <MenuItem component={RouterLink} href={editHref} onClick={menuActions.onClose}>
              <Iconify icon="solar:pen-bold" />
              Edit
            </MenuItem>
          </li>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title="Delete"
        content="Delete is not supported by the API yet."
        action={
          <Button variant="contained" color="error" onClick={confirmDialog.onFalse}>
            OK
          </Button>
        }
      />
    </>
  );
}
```

> The backend has no `DELETE /dogs/{id}` — the row intentionally offers View/Edit only.

- [ ] **Step 2: Create `src/sections/dog/dog-table-toolbar.tsx`** (search + sex + breed filter):

```tsx
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IDogTableFilters } from 'src/types/dog';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type BreedOption = { id: string; name: string };

type Props = {
  filters: UseSetStateReturn<IDogTableFilters>;
  onResetPage: () => void;
  breedOptions: BreedOption[];
};

export function DogTableToolbar({ filters, onResetPage, breedOptions }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ search: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleSex = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ sex: event.target.value as IDogTableFilters['sex'] });
    },
    [onResetPage, updateFilters]
  );

  const handleBreed = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ breed_id: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  return (
    <Box sx={{ p: 2.5, gap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        select
        label="Sex"
        value={currentFilters.sex}
        onChange={handleSex}
        sx={{ width: { xs: 1, md: 160 } }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="male">Male</MenuItem>
        <MenuItem value="female">Female</MenuItem>
      </TextField>

      <TextField
        select
        label="Breed"
        value={currentFilters.breed_id}
        onChange={handleBreed}
        sx={{ width: { xs: 1, md: 220 } }}
      >
        <MenuItem value="">All</MenuItem>
        {breedOptions.map((b) => (
          <MenuItem key={b.id} value={b.id}>
            {b.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        value={currentFilters.search}
        onChange={handleSearch}
        placeholder="Search dogs..."
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ flex: 1, minWidth: 200 }}
      />
    </Box>
  );
}
```

- [ ] **Step 3: Create `src/sections/dog/dog-table-filters-result.tsx`**

```tsx
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IDogTableFilters } from 'src/types/dog';
import type { FiltersResultProps } from 'src/components/filters-result';

import { useCallback } from 'react';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  filters: UseSetStateReturn<IDogTableFilters>;
};

export function DogTableFiltersResult({ filters, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleRemoveSearch = useCallback(() => {
    updateFilters({ search: '' });
  }, [updateFilters]);

  const handleRemoveSex = useCallback(() => {
    updateFilters({ sex: 'all' });
  }, [updateFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={() => resetFilters()} sx={sx}>
      <FiltersBlock label="Sex:" isShow={currentFilters.sex !== 'all'}>
        <Chip {...chipProps} label={currentFilters.sex} onDelete={handleRemoveSex} />
      </FiltersBlock>

      <FiltersBlock label="Search:" isShow={!!currentFilters.search}>
        <Chip {...chipProps} label={currentFilters.search} onDelete={handleRemoveSearch} />
      </FiltersBlock>
    </FiltersResult>
  );
}
```

> Add the missing import at top: `import Chip from '@mui/material/Chip';`

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (If `src/components/filters-result` export names differ, open that file and match the exact exports — they exist in Minimal Kit.)

- [ ] **Step 5: Commit**

```bash
git add src/sections/dog/dog-table-row.tsx src/sections/dog/dog-table-toolbar.tsx src/sections/dog/dog-table-filters-result.tsx
git commit -m "feat: Dogs table row, toolbar, and filters-result"
```

---

### Task B5: Dogs list view (server-side paging/filters)

**Files:**
- Create: `src/sections/dog/view/dog-list-view.tsx`
- Create: `src/sections/dog/view/index.ts`

- [ ] **Step 1: Create `src/sections/dog/view/dog-list-view.tsx`**

```tsx
'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IDogTableFilters } from 'src/types/dog';

import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetDogs } from 'src/actions/dog';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { DogTableRow } from '../dog-table-row';
import { DogTableToolbar } from '../dog-table-toolbar';
import { DogTableFiltersResult } from '../dog-table-filters-result';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'name', label: 'Name' },
  { id: 'sex', label: 'Sex', width: 120 },
  { id: 'rkf_number', label: 'RKF #', width: 160 },
  { id: 'date_of_birth', label: 'Born', width: 140 },
  { id: 'color', label: 'Color', width: 160 },
  { id: '', width: 88 },
];

export function DogListView() {
  const table = useTable({ defaultRowsPerPage: 25 });

  const filters = useSetState<IDogTableFilters>({ search: '', breed_id: '', kennel_id: '', sex: 'all' });
  const { state: currentFilters } = filters;

  const { dogs, dogsTotal, dogsLoading, dogsEmpty } = useGetDogs({
    page: table.page + 1, // backend is 1-based
    per_page: table.rowsPerPage,
    search: currentFilters.search || undefined,
    breed_id: currentFilters.breed_id || undefined,
    sex: currentFilters.sex,
  });

  const canReset = !!currentFilters.search || !!currentFilters.breed_id || currentFilters.sex !== 'all';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Dogs"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Dogs' }]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.dogs.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Add dog
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <DogTableToolbar filters={filters} onResetPage={table.onResetPage} breedOptions={[]} />

        {canReset && (
          <DogTableFiltersResult filters={filters} totalResults={dogsTotal} sx={{ p: 2.5, pt: 0 }} />
        )}

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom headCells={TABLE_HEAD} rowCount={dogs.length} />

              <TableBody>
                {dogs.map((row) => (
                  <DogTableRow
                    key={row.id}
                    row={row}
                    detailsHref={paths.dashboard.dogs.details(row.id)}
                    editHref={paths.dashboard.dogs.edit(row.id)}
                  />
                ))}

                <TableNoData notFound={!dogsLoading && dogsEmpty} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={dogsTotal}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
```

- [ ] **Step 2: Create `src/sections/dog/view/index.ts`**

```ts
export * from './dog-list-view';
export * from './dog-create-view';
export * from './dog-edit-view';
export * from './dog-detail-view';
```

> `dog-create-view`, `dog-edit-view`, `dog-detail-view` are created in B6–B7. If executing strictly in order, add those three export lines as each file is created to keep `npx tsc --noEmit` green; or create empty stubs now.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors only about not-yet-created view modules referenced in `index.ts`. Proceed to B6/B7; this goes green by B7. (Or temporarily export only `dog-list-view` and add the rest later.)

- [ ] **Step 4: Commit**

```bash
git add src/sections/dog/view/dog-list-view.tsx src/sections/dog/view/index.ts
git commit -m "feat: Dogs list view with server-side paging + filters"
```

---

### Task B6: Dog create/edit form + create/edit views

**Files:**
- Create: `src/sections/dog/dog-create-edit-form.tsx`
- Create: `src/sections/dog/view/dog-create-view.tsx`
- Create: `src/sections/dog/view/dog-edit-view.tsx`

- [ ] **Step 1: Create `src/sections/dog/dog-create-edit-form.tsx`**

```tsx
'use client';

import type { IDogItem } from 'src/types/dog';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { createDog, updateDog } from 'src/actions/dog';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type DogSchemaType = z.infer<typeof DogSchema>;

export const DogSchema = z.object({
  name: z.string().min(1, { error: 'Name is required!' }),
  sex: z.enum(['male', 'female']),
  breed_id: z.string().min(1, { error: 'Breed is required!' }),
  date_of_birth: z.string().nullable(),
  color: z.string().nullable(),
  rkf_number: z.string().nullable(),
  tattoo: z.string().nullable(),
  microchip: z.string().nullable(),
  description: z.string().nullable(),
});

// ----------------------------------------------------------------------

type Props = { currentDog?: IDogItem };

export function DogCreateEditForm({ currentDog }: Props) {
  const router = useRouter();

  const defaultValues: DogSchemaType = {
    name: '',
    sex: 'male',
    breed_id: '',
    date_of_birth: null,
    color: null,
    rkf_number: null,
    tattoo: null,
    microchip: null,
    description: null,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(DogSchema),
    defaultValues,
    values: currentDog
      ? {
          name: currentDog.name,
          sex: currentDog.sex,
          breed_id: currentDog.breed_id,
          date_of_birth: currentDog.date_of_birth,
          color: currentDog.color,
          rkf_number: currentDog.rkf_number,
          tattoo: currentDog.tattoo,
          microchip: currentDog.microchip,
          description: currentDog.description,
        }
      : undefined,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentDog) {
        await updateDog(currentDog.id, data);
        toast.success('Update success!');
      } else {
        await createDog(data);
        toast.success('Create success!');
      }
      router.push(paths.dashboard.dogs.root);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Save failed');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          <Field.Text name="name" label="Name" />
          <Field.Select name="sex" label="Sex">
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
          </Field.Select>
          <Field.Text name="breed_id" label="Breed ID" helperText="UUID from /references/breeds" />
          <Field.Text name="date_of_birth" label="Date of birth" placeholder="YYYY-MM-DD" />
          <Field.Text name="color" label="Color" />
          <Field.Text name="rkf_number" label="RKF number" />
          <Field.Text name="tattoo" label="Tattoo" />
          <Field.Text name="microchip" label="Microchip" />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field.Text name="description" label="Description" multiline rows={3} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {currentDog ? 'Save changes' : 'Create dog'}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
```

> `breed_id` is a plain text field for now (paste a UUID). A breed autocomplete backed by `/references/breeds` is a follow-up; keep it simple to ship the slice.

- [ ] **Step 2: Create `src/sections/dog/view/dog-create-view.tsx`**

```tsx
'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DogCreateEditForm } from '../dog-create-edit-form';

// ----------------------------------------------------------------------

export function DogCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new dog"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Dogs', href: paths.dashboard.dogs.root },
          { name: 'New' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <DogCreateEditForm />
    </DashboardContent>
  );
}
```

- [ ] **Step 3: Create `src/sections/dog/view/dog-edit-view.tsx`**

```tsx
'use client';

import { paths } from 'src/routes/paths';

import { useGetDog } from 'src/actions/dog';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DogCreateEditForm } from '../dog-create-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function DogEditView({ id }: Props) {
  const { dog, dogLoading } = useGetDog(id);

  if (dogLoading) return <LoadingScreen />;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit dog"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Dogs', href: paths.dashboard.dogs.root },
          { name: dog?.name ?? 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <DogCreateEditForm currentDog={dog} />
    </DashboardContent>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (verify `Field.Select` exists in `src/components/hook-form`; it does in Minimal Kit).

- [ ] **Step 5: Commit**

```bash
git add src/sections/dog/dog-create-edit-form.tsx src/sections/dog/view/dog-create-view.tsx src/sections/dog/view/dog-edit-view.tsx
git commit -m "feat: Dog create/edit form + create/edit views"
```

---

### Task B7: Dog detail view (info + titles tabs)

**Files:**
- Create: `src/sections/dog/view/dog-detail-view.tsx`

- [ ] **Step 1: Create `src/sections/dog/view/dog-detail-view.tsx`**

```tsx
'use client';

import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetDog, useGetDogTitles } from 'src/actions/dog';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

type Props = { id: string };

export function DogDetailView({ id }: Props) {
  const [tab, setTab] = useState('info');

  const { dog, dogLoading } = useGetDog(id);
  const { titles } = useGetDogTitles(id);

  if (dogLoading) return <LoadingScreen />;
  if (!dog) return <DashboardContent>Dog not found.</DashboardContent>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={dog.name}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Dogs', href: paths.dashboard.dogs.root },
          { name: dog.name },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.dogs.edit(dog.id)}
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            Edit
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="info" label="Info" />
        <Tab value="titles" label={`Titles (${titles.length})`} />
      </Tabs>

      {tab === 'info' && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="body2">Sex: {dog.sex}</Typography>
            <Typography variant="body2">RKF #: {dog.rkf_number ?? '—'}</Typography>
            <Typography variant="body2">Born: {dog.date_of_birth ?? '—'}</Typography>
            <Typography variant="body2">Color: {dog.color ?? '—'}</Typography>
            <Typography variant="body2">Microchip: {dog.microchip ?? '—'}</Typography>
            <Typography variant="body2">Description: {dog.description ?? '—'}</Typography>
          </Stack>
        </Card>
      )}

      {tab === 'titles' && (
        <Card sx={{ p: 3 }}>
          {titles.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No titles yet.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {titles.map((t) => (
                <Typography key={t.id} variant="body2">
                  {t.title_id} — earned {t.date_earned}
                </Typography>
              ))}
            </Stack>
          )}
        </Card>
      )}
    </DashboardContent>
  );
}
```

> Pedigree (`useGetDogPedigree`) is wired in the data layer but its response shape isn't typed yet; a pedigree tree tab is a follow-up. Info + Titles prove the detail pattern.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. `src/sections/dog/view/index.ts` now resolves all four views.

- [ ] **Step 3: Commit**

```bash
git add src/sections/dog/view/dog-detail-view.tsx
git commit -m "feat: Dog detail view with info + titles tabs"
```

---

### Task B8: App Router pages + RBAC gating

**Files:**
- Create: `src/app/dashboard/dogs/page.tsx`
- Create: `src/app/dashboard/dogs/new/page.tsx`
- Create: `src/app/dashboard/dogs/[id]/page.tsx`
- Create: `src/app/dashboard/dogs/[id]/edit/page.tsx`

- [ ] **Step 1: Create `src/app/dashboard/dogs/page.tsx`** (list — readable by anyone with `dogs:view`):

```tsx
import { CONFIG } from 'src/global-config';

import { PermissionGuard } from 'src/auth/guard';

import { DogListView } from 'src/sections/dog/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Dogs | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="dogs:view">
      <DogListView />
    </PermissionGuard>
  );
}
```

- [ ] **Step 2: Create `src/app/dashboard/dogs/new/page.tsx`** (create — needs `dogs:create`):

```tsx
import { CONFIG } from 'src/global-config';

import { PermissionGuard } from 'src/auth/guard';

import { DogCreateView } from 'src/sections/dog/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Create dog | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="dogs:create">
      <DogCreateView />
    </PermissionGuard>
  );
}
```

- [ ] **Step 3: Create `src/app/dashboard/dogs/[id]/page.tsx`** (detail):

```tsx
import { CONFIG } from 'src/global-config';

import { PermissionGuard } from 'src/auth/guard';

import { DogDetailView } from 'src/sections/dog/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Dog | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="dogs:view">
      <DogDetailView id={id} />
    </PermissionGuard>
  );
}
```

- [ ] **Step 4: Create `src/app/dashboard/dogs/[id]/edit/page.tsx`** (edit — needs `dogs:edit`):

```tsx
import { CONFIG } from 'src/global-config';

import { PermissionGuard } from 'src/auth/guard';

import { DogEditView } from 'src/sections/dog/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit dog | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="dogs:edit">
      <DogEditView id={id} />
    </PermissionGuard>
  );
}
```

> `params` is a Promise in Next 15+/16 App Router — `await` it. Confirm against an existing dynamic page (e.g. `src/app/dashboard/user/[id]/edit/page.tsx`) and match its exact signature.

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/dogs
git commit -m "feat: Dogs App Router pages with RBAC permission guards"
```

---

### Task B9: End-to-end manual verification (Dogs)

**Files:** none (verification only).

- [ ] **Step 1: Build sanity**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green.

- [ ] **Step 2: Run app** (backend up): `npm run dev` → open `http://localhost:8082`.

- [ ] **Step 3: As admin** (`admin@admin.com` / `Password123!`):
  1. Nav → ShowTail → Dogs → list loads (`GET /api/dogs?page=1&per_page=25` 200).
  2. "Add dog" → fill Name, Sex, paste a real `breed_id` (grab one from `GET /api/references/breeds` via Swagger) → Create → toast success, redirected to list, new dog visible.
  3. Open the dog → detail view → Info + Titles tabs render.
  4. Edit → change color → Save → list/detail reflect the change.
  5. Filters: type in search, switch Sex → list re-queries with the new params (check Network tab).
  6. Pagination: change rows-per-page / next page → new request with `page`/`per_page`.

- [ ] **Step 4: RBAC check** (optional, needs a non-breeder user). Register a `buyer` via `/auth/register`, sign in: `/dashboard/dogs/new` should redirect to `/error/403` (no `dogs:create`); the list (`dogs:view`) should still load.

- [ ] **Step 5: Token refresh check.** Sign in, wait >15 min (or set backend `ACCESS_TOKEN_EXPIRE_MINUTES=1` temporarily), then trigger any Dogs request → it should 401 once, silently refresh via `/api/auth/refresh`, and succeed (observe in Network tab). Restore the backend setting after.

- [ ] **Step 6: Final commit (notes only, if any tweaks were needed).** If steps surfaced minor fixes, commit them with a clear message; otherwise this phase is done.

---

## Done criteria

- `npx tsc --noEmit`, `npm run lint`, and `npm test` all pass.
- Login as admin works against the live backend; tokens stored; `/users/me` drives roles/permissions; access-token refresh is automatic on 401.
- Dogs domain: list (server paging + filters), create, edit, detail (info + titles) all work against the backend, gated by RBAC.
- Foundation + Dogs patterns are ready to be copied for the next domain (its own spec + plan).
