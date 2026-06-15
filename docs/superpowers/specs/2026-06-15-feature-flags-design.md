# Feature Flags — design

**Date:** 2026-06-15
**Status:** Approved

## Problem

The backend exposes `GET /feature-flags → { [name: string]: boolean }` (public, no auth).
The frontend needs a mechanism to hide not-yet-ready UI elements, menu items, and routes
behind these flags. First consumer: hide the **Support** section.

## Backend facts (verified against running instance)

- `GET /feature-flags` → snapshot of defined flags. Currently: `{"official_documents": false, "phone_otp_auth": false}`.
- `PUT /feature-flags/{name}` (admin) sets a flag; **unknown name → 404** (closed enum on backend).
- Endpoint is **public** — returns data without a bearer token, so flags are available on the
  pre-auth login screens (e.g. `phone_otp_auth`).
- There is **no `support` flag** in the backend enum.

## Decisions

1. **Fail-closed.** A flag that is absent from the snapshot, `false`, still loading, or whose
   fetch failed → the feature is **hidden**. Non-flagged UI is always shown. This lets us hide
   `support` without any backend change (an absent flag reads as disabled) and prevents
   unfinished features from leaking on a transient backend hiccup.
2. **Routes redirect to 404** when their feature is disabled (the feature "does not exist" while
   off), via a dedicated `FeatureGuard` mirroring `PermissionGuard`.
3. **Scope:** build the mechanism + apply it to hide Support. Out of scope: admin toggle UI
   (`PUT`), wiring `official_documents` / `phone_otp_auth` to their features.

## Architecture

Feature flags mirror the existing permission system (`<Can>`, `PermissionGuard`,
`filterNavItems`, `usePermissions`).

### Data layer
- `src/lib/axios.ts`: add `endpoints.featureFlags = '/feature-flags'`.
- `src/config/feature-flags.ts`: typed registry of flag keys the frontend references —
  `FEATURE_FLAGS = ['official_documents', 'phone_otp_auth', 'support'] as const` and
  `type FeatureFlag = (typeof FEATURE_FLAGS)[number]`. `support` is intentionally present even
  though the backend enum lacks it; under fail-closed it resolves to "always hidden" until the
  backend adds it.
- `src/actions/feature-flag.ts`: SWR query hook `useFeatureFlagsQuery()` (pattern from
  `reference.ts`: no revalidate on focus/reconnect) → `{ flags, isLoading, error }`.

### Pure logic (unit-tested, no React)
- `src/utils/feature-flags.ts`:
  `isFeatureEnabled(flags, flag, { loading, error }): boolean` —
  returns `false` when `loading || error || !flags?.[flag]`, else the boolean value.

### Provider + hook
- `src/feature-flags/feature-flags-provider.tsx` + `use-feature-flags.ts`.
- Mounted high in the provider tree, **independent of auth** (public endpoint, needed pre-login).
- Context value: `{ flags, loading, isEnabled(flag: FeatureFlag): boolean }` where `isEnabled`
  delegates to `isFeatureEnabled`.

### Gating primitives (parallel to permissions)
- `src/components/feature/feature.tsx`: `<Feature flag fallback>` — copy of `<Can>`.
- `src/auth/guard/feature-guard.tsx` (or `src/feature-flags/feature-guard.tsx`): copy of
  `PermissionGuard` — shows `SplashScreen` while `loading`, then `router.replace(paths.page404)`
  when `!isEnabled(flag)`.

### Navigation integration
- `src/components/nav-section/types.ts`: add `flag?: FeatureFlag` to `NavItemDataProps`.
- `src/layouts/nav-filter.ts`: `filterNavItems` takes an additional `flagEnabled(flag)`
  predicate; drops items where `item.flag && !flagEnabled(item.flag)`, alongside the existing
  `permission` check, recursively.
- `src/layouts/dashboard/layout.tsx`: pass `isEnabled` from `useFeatureFlags` into the
  `navData` memo.

### Apply to Support
- `src/layouts/nav-config-dashboard.tsx`: add `flag: 'support'` to the Support nav item.
- Wrap `src/app/dashboard/support/page.tsx`, `.../support/new/page.tsx`,
  `.../support/[id]/page.tsx` in `<FeatureGuard flag="support">` → deep-link yields 404.

## Testing (vitest)
- `isFeatureEnabled`: absent / `false` / loading / error → `false`; present-`true` → `true`.
- `filterNavItems`: drops flagged-off items; keeps flagged-on; combines correctly with
  `permission` filtering.

## Gates
`npx tsc --noEmit` → 0, `npm run lint` → 0, `npm test` → green.
