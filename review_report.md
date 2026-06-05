# Code Review Report
**Date:** 2026-06-05
**Project:** Show Ring frontend (Next.js 16 / MUI 7 / TypeScript — "Minimal Kit" template, ShowTail backend)
**Branch reviewed:** `fix/account-security-review` (account-security feature surface: session hardening on password/email change)

> **Scope note.** The `/deepreview` template is written for a Python backend (requirements.txt, coroutines, bare `except:`, N+1 SQL). This repository is a **TypeScript/React frontend** — there is no Python here, so the Python-specific and SQL/ORM checklist items do not apply and are marked N/A. The analysis below is the equivalent for a TS/Next.js codebase (XSS/token handling, async/`await` correctness in handlers, resource/listener cleanup, request patterns, separation of concerns, test coverage).
>
> The branch itself is a 3-file change on top of `main`, but it is the review branch for the whole **account-security** feature merged in `ba6589a`. I reviewed the full feature surface: `src/actions/account.ts`, `src/actions/account-errors.ts`, `src/sections/profile/profile-security-form.tsx`, `src/auth/view/confirm-email-change-view.tsx`, `src/auth/context/jwt/*`, and the 401-refresh interceptor in `src/lib/axios.ts`.

## Executive Summary

This is a **clean, well-reasoned branch**. The core change correctly fixes a real latent bug: after a password change or email-change confirmation, the ShowTail backend revokes **all** refresh tokens, so the access/refresh pair still sitting in `localStorage` is dead — but the previous code only showed a toast and left `state.user` "authenticated" until the next page load (at which point the user would be silently bounced on the first 401-refresh). The branch now tears the session down explicitly (`signOut()` → `checkUserSession()`), and for the password flow redirects to sign-in. The inline comments accurately document *why* each step exists.

**Quality gates (verified by running them):**
- `npx tsc --noEmit` → ✅ 0 source errors (the only emitted error is in generated `.next/dev/types/validator.ts`, a known stale-Next-types artifact, not project code).
- `npx eslint` on changed files → ✅ 0 errors.
- `npx vitest run` → ✅ 9 files / **45 tests passing**.

No Critical or Major correctness bugs were found. Findings are minor: a small DRY/architecture nit, a testing gap on pure schema logic, a couple of UX/robustness edge cases, and one standing template-level security risk (JWT in `localStorage`) that this branch does not introduce but is worth recording.

## Critical Issues 🔴

None found.

## Major Issues 🟠

None found.

## Minor Issues 🟡

**[TESTING] Pure password-schema logic is untested**
- File: `src/sections/profile/profile-security-form.tsx:42`
- Description: `PasswordSchema` contains two non-trivial pure-logic refinements — `new_password === confirm_password` and `new_password !== current_password` — plus the 8–128 length bounds. CLAUDE.md explicitly scopes unit tests to "чистой логики", and `accountErrorMessage` already has a test (`src/actions/__tests__/account-errors.test.ts`), but the schema refinements have none. A future edit to the `.refine()` order or `path` would break silently.
- Note: The design spec (`docs/superpowers/specs/2026-06-04-account-security-api-design.md:98`) only required the `accountErrorMessage` unit test, so this is a gap relative to the project standard, not the spec.
- Suggestion: Export `PasswordSchema`/`EmailSchema` (already exported) and add a small vitest covering: mismatch → error on `confirm_password`; new==current → error on `new_password`; <8 / >128 length; happy path. Pure `safeParse` assertions, no React needed.

**[ARCHITECTURE] Duplicated session-teardown sequence**
- File: `src/sections/profile/profile-security-form.tsx:154` and `src/auth/view/confirm-email-change-view.tsx:48`
- Description: The exact "backend revoked all refresh tokens → clear local session + resync React context" sequence (`await signOut(); await checkUserSession?.();`) is now copy-pasted in two places, each with its own multi-line comment explaining the same backend behaviour. If the teardown contract changes (e.g. a third revoking endpoint is added, or `checkUserSession` is renamed), both sites must be kept in sync by hand.
- Suggestion: Extract a tiny helper, e.g. `useSessionResync()` returning an `async` `resyncAfterTokenRevocation()` that wraps `signOut()` + `checkUserSession()`, or a plain `async function tearDownSession(checkUserSession)` in the jwt action module. Low priority — two call sites is the threshold, not an emergency.

**[UX/ROBUSTNESS] Possible `returnTo` bounce-back after password change**
- File: `src/sections/profile/profile-security-form.tsx:154-157`
- Description: On password change the flow does `signOut()` → `checkUserSession()` (sets `user=null`) → `router.replace(signIn)`. The moment `user` becomes `null`, the `AuthGuard` wrapping `/dashboard/profile/security` can independently fire its own redirect to sign-in **with `?returnTo=/dashboard/profile/security`**, racing the explicit `router.replace` (which has no `returnTo`). Depending on which wins, after re-login the user may be bounced straight back to the security page rather than a neutral landing. Not a functional break, just a slightly surprising post-login destination.
- Suggestion: Optional — accept it (harmless), or make the intent explicit by navigating before the context flips, or pass an explicit neutral `returnTo`. Document the chosen behaviour either way.

**[UX] Raw backend `detail` shown to users on unmapped error codes**
- File: `src/actions/account-errors.ts:16-17`
- Description: `accountErrorMessage` maps the four known codes to RU and otherwise returns the raw string (`ACCOUNT_ERROR_MESSAGES[raw] ?? raw`). For any unmapped backend `detail` (e.g. a future English/technical code, or a 422 validation string), that raw value is surfaced verbatim in a toast/alert.
- Note: This is a deliberate, documented fallback — the inline comment says *"Переводим известные коды в RU; иначе — как есть"*, and the spec (line 93) reasons that 422 "не ожидается" because client-side zod enforces 8–128. The risk is low and intentional.
- Suggestion: Consider a generic RU fallback (e.g. «Не удалось выполнить операцию, попробуйте позже») for codes that look like machine tokens (`/^[a-z_]+$/`) while still passing through human-readable RU messages. Minor.

**[VALIDATION] Loose client-side email regex**
- File: `src/sections/profile/profile-security-form.tsx:36`
- Description: `/.+@.+\..+/` accepts strings with spaces and other clearly-invalid shapes (e.g. `"a b@c.d"`). The backend is authoritative (`email_taken`/validation), so this is only a first-pass UX filter.
- Suggestion: Use zod's built-in `z.string().email()` (zod v4 is pinned, `package.json` → `"zod": "4.0.15"`) for a stricter, standard check, keeping the RU message via `{ error: 'Некорректный email' }`.

## Post-review fixes applied ✅ (2026-06-05)

All five Minor findings were addressed in the same branch. Gates re-run green: `tsc` 0 source errors, `eslint` 0, **vitest 55/55** (+10 new tests).

- **[TESTING] resolved** — added `src/sections/profile/__tests__/profile-security-schema.test.ts` (9 tests) covering `EmailSchema` (valid / empty / malformed / missing password) and `PasswordSchema` (length bounds, `confirm_password` mismatch path, `new == current` path).
- **[ARCHITECTURE] resolved** — extracted `resetRevokedSession(checkUserSession)` into `src/auth/context/jwt/action.ts`; both `profile-security-form.tsx` and `confirm-email-change-view.tsx` now call the shared helper instead of duplicating `signOut()` + `checkUserSession()` and their comments.
- **[UX/ROBUSTNESS — returnTo race] resolved as documented** — investigation confirmed the current order is *required*: `GuestGuard` (`src/auth/guard/guest-guard.tsx`) redirects a still-authenticated user away from `/auth/*`, so the session **must** be cleared before `router.replace(signIn)` — reordering would cause a worse bounce. The constraint and the accepted `AuthGuard` `returnTo` behaviour are now documented inline at `profile-security-form.tsx:149-154`.
- **[UX — raw detail] resolved** — `accountErrorMessage` now hides unmapped machine-token codes (`/^[a-z][a-z0-9_]*$/`) behind a generic RU message while still passing through human-readable text (network fallbacks); covered by two new test cases.
- **[VALIDATION — email regex] resolved** — replaced the loose `/.+@.+\..+/` with the template's canonical `schemaUtils.email({ error: {...} })` (`z.email()` under the hood), per the CLAUDE.md reuse rule.

## Positive observations ✅

- **Correct root-cause fix, not a band-aid.** The branch diagnoses the actual failure mode (revoked refresh tokens + stale `state.user`) and fixes it at the right layer, with comments that quote the backend behaviour. E.g. `profile-security-form.tsx:150-153`: *"Бэкенд отозвал все refresh-токены (включая текущий) — … иначе пользователя молча выкинет при ближайшем refresh access-токена."* The fix matches that explanation exactly.
- **`signOut()` is genuinely best-effort and safe in this exact scenario.** `src/auth/context/jwt/action.ts:33-46` swallows the (expected) failure of `POST /auth/logout` — which *will* fail here because the refresh token was just revoked — and still clears local storage in `finally`. The doomed network call is harmless and intentional.
- **Dead-endpoint removal is clean.** Dropping `endpoints.dog.images` (`src/lib/axios.ts`) is safe — a repo-wide search confirms **zero** remaining references to `dog.images`/that route; it pointed at a backend endpoint that does not exist (the spec `docs/superpowers/specs/2026-06-03-showcase-backend-requirements.md:26` lists `POST /dogs/{id}/images` as a *future* backend request).
- **Per-field password visibility toggles.** Refactoring the single `showPassword` into `showCurrent` / `showNew` / `showConfirm` via a `renderToggle(field)` helper (`profile-security-form.tsx:127-129, 164-170`) is a real UX improvement and is implemented without duplication.
- **401-refresh interceptor is solid.** `src/lib/axios.ts:94-134` implements single-flight refresh with a parked-request queue, an `_retry` guard against infinite loops, and correctly excludes `/auth/*` calls (`isAuthCall`) so that a failing `confirm-email-change`/`login` doesn't trigger a refresh storm. The `finally { isRefreshing = false }` correctly bounds the flag.
- **Route guard matches design.** `src/app/confirm-email-change/layout.tsx` wraps `AuthCenteredLayout` **without** `GuestGuard`, exactly as the spec requires (line 79) so both logged-in and guest users can complete the link.
- **Manual confirm (no auto-fire).** The email-change confirmation runs on an explicit button press, not on mount — the spec notes this is deliberate, to defend a one-time token against email pre-fetch/link scanners (`...view.tsx` + spec line 83). Good security instinct.
- **Email card correctly does *not* mutate `me`.** `updateMyEmail` drops the `mutate(endpoints.auth.me)` because the email doesn't change until confirmation; the comment at `src/actions/account.ts:73-74` documents this precisely.

## Recommendations

1. **Add the `PasswordSchema` unit test** (the one concrete gap vs. the project's own standard). Quick win, pure logic, no infra.
2. **Extract the session-teardown helper** to remove the two-site duplication before a third revoking flow appears.
3. **Decide and document the post-password-change `returnTo` behaviour** to avoid the guard-vs-`router.replace` race ambiguity.
4. **(Standing, not this branch) JWT in `localStorage`.** Access + refresh tokens live in `localStorage` (`src/auth/context/jwt/constant.ts`, read in `src/lib/axios.ts:21,70`), which is readable by any injected script (XSS). This is the inherited Minimal-Kit pattern and out of scope for this fix, but worth a tracked ticket: consider httpOnly-cookie-backed refresh tokens if/when the backend can support it. No action required on this branch.
5. **Keep `accountErrorMessage` in sync with backend codes.** If ShowTail adds account error codes, add them to `ACCOUNT_ERROR_MESSAGES` and the existing test in the same change.

---

### Checklist coverage (for transparency)

| Template area | Result |
|---|---|
| Injection (SQL/command/path traversal) | N/A — frontend; no SQL/shell/fs. Backend is authoritative. |
| Hardcoded secrets/tokens | ✅ None. Tokens come from backend at runtime. |
| Input validation / sanitization | 🟡 Email regex loose (see Minor); password bounds enforced. |
| Insecure/unpinned deps | ✅ Versions read from `package.json` (zod 4.0.15, next ^16.2.4, axios ^1.11.0, swr ^2.3.4). No new deps added by this branch. |
| Sensitive data in logs/responses | 🟡 `console.error(error)` in handlers logs reduced `Error(detail)` only — low risk; template-standard. |
| Missing `await` / async correctness | ✅ All awaited (`updateMyPassword`, `signOut`, `checkUserSession`, `confirmEmailChange`). No floating promises in the changed handlers. |
| Mutable default args / bare except | N/A (Python-specific). TS equivalent (shared mutable module state) reviewed: `pendingQueue`/`isRefreshing` in axios are intentional and correctly reset. |
| Unclosed resources / listeners | ✅ No subscriptions/timers/listeners added; SWR options disable revalidation deliberately. |
| Circular imports / separation of concerns | ✅ Actions ↔ views ↔ auth-context layering is clean; only the minor cross-cutting duplication noted. |
| N+1 / caching | ✅ N/A server-side; `swrOptions` intentionally avoids refetch churn. |
| Testing — critical paths / error branches | 🟡 `accountErrorMessage` tested incl. fallback; `PasswordSchema` refinements untested (see Minor). |
