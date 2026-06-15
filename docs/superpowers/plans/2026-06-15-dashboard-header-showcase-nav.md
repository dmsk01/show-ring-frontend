# Public Nav in Dashboard Header — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the public showcase navigation (Home · Kennels · Animals · Shows → `/`, `/kennels`, `/animals`, `/shows`) in the dashboard header — desktop as a horizontal nav, mobile as a section in the burger drawer.

**Architecture:** Reuse the existing public-site nav: feed `navData` from `src/layouts/nav-config-main.tsx` into the public `NavDesktop` component (desktop) and into the dashboard burger drawer (`NavMobile`) as an extra section. Only `src/layouts/dashboard/layout.tsx` and two locale files change. The dashboard sidebar (`NavVertical`) is untouched.

**Tech Stack:** Next.js 16 App Router, MUI 7, TypeScript, react-i18next, Minimal Kit layout components.

---

## Why no new unit test

This is layout wiring with no extractable pure logic (the only computation is a trivial field-pick map). The repo's vitest suite covers pure logic, not layout render. Verification is `tsc` (types), `lint`, the existing `npm test` staying green, plus a manual UI check. Do **not** invent a brittle render test.

## File Structure

- `src/layouts/dashboard/layout.tsx` — MODIFY. Add imports for `NavDesktop` + main `navData`; render public `NavDesktop` in the header `leftArea` (desktop, non-horizontal mode); prepend a "site" section to the data passed to the burger `NavMobile`. Sidebar `NavVertical` keeps the original `navData`.
- `src/locales/langs/ru/navbar.json` — MODIFY. Add `main.menu` = "Сайт".
- `src/locales/langs/en/navbar.json` — MODIFY. Add `main.menu` = "Site".

No other files change. `nav-config-main.tsx`, `nav-config-dashboard.tsx`, `NavDesktop`, `NavVertical`, `NavMobile`, show views — all untouched.

---

### Task 1: Add `main.menu` i18n key (RU + EN)

**Files:**
- Modify: `src/locales/langs/ru/navbar.json`
- Modify: `src/locales/langs/en/navbar.json`

- [ ] **Step 1: Add the key to the RU file**

In `src/locales/langs/ru/navbar.json`, the `main` object currently is:

```json
  "main": {
    "home": "Главная",
    "kennels": "Питомники",
    "animals": "Животные",
    "shows": "Выставки"
  }
```

Change it to:

```json
  "main": {
    "menu": "Сайт",
    "home": "Главная",
    "kennels": "Питомники",
    "animals": "Животные",
    "shows": "Выставки"
  }
```

- [ ] **Step 2: Add the key to the EN file**

In `src/locales/langs/en/navbar.json`, change the `main` object to:

```json
  "main": {
    "menu": "Site",
    "home": "Home",
    "kennels": "Kennels",
    "animals": "Animals",
    "shows": "Shows"
  }
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "require('./src/locales/langs/ru/navbar.json'); require('./src/locales/langs/en/navbar.json'); console.log('ok')"`
Expected: prints `ok` (no JSON parse error).

- [ ] **Step 4: Commit**

```bash
git add src/locales/langs/ru/navbar.json src/locales/langs/en/navbar.json
git commit -m "i18n(navbar): add main.menu label for dashboard header showcase nav

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Render public `NavDesktop` in the dashboard header (desktop)

**Files:**
- Modify: `src/layouts/dashboard/layout.tsx`

Context: the header is built in `renderHeader()`. `t` comes from `useTranslate('navbar')` (same namespace `nav-config-main` expects). `theme` and `layoutQuery` are already in scope. `isNavHorizontal` is already computed (line ~100). The public nav is rendered only when **not** in horizontal mode, so it never collides with the dashboard `NavHorizontal` already shown in `bottomArea`/`leftArea` for that mode.

- [ ] **Step 1: Add the two imports**

Near the other layout imports (after `import { NavHorizontal } from './nav-horizontal';`), add:

```tsx
import { NavDesktop } from '../main/nav/desktop';
import { navData as mainNavData } from '../nav-config-main';
```

- [ ] **Step 2: Memoize the showcase nav data**

Inside `DashboardLayout`, right after the existing `navData` `useMemo` (the one ending `[rawNavData, can, canAny, canAll, isEnabled]`), add:

```tsx
  const showcaseNav = useMemo(() => mainNavData(t), [t]);
```

- [ ] **Step 3: Render `NavDesktop` in the header `leftArea`**

In `renderHeader()`, inside `headerSlots.leftArea`, the current JSX ends with the horizontal-mode Logo and `VerticalDivider`. Immediately **after** the `<NavMobile ... />` line and **before** the `{/** @slot Logo */}` block, add:

```tsx
          {/** @slot Public showcase nav (desktop, vertical/mini modes) */}
          {!isNavHorizontal && (
            <NavDesktop
              data={showcaseNav}
              sx={{
                display: 'none',
                [theme.breakpoints.up(layoutQuery)]: { ml: 1, display: 'flex' },
              }}
            />
          )}
```

- [ ] **Step 4: Verify types and lint**

Run: `npx tsc --noEmit`
Expected: 0 errors.

Run: `npx eslint --fix src/layouts/dashboard/layout.tsx && npx eslint src/layouts/dashboard/layout.tsx`
Expected: 0 errors (perfectionist may reorder the two new imports — that's fine).

- [ ] **Step 5: Commit**

```bash
git add src/layouts/dashboard/layout.tsx
git commit -m "feat(dashboard): show public showcase nav in header on desktop

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Add showcase section to the dashboard burger drawer (mobile)

**Files:**
- Modify: `src/layouts/dashboard/layout.tsx`

Context: on mobile the dashboard has no header nav — the burger drawer (`NavMobile`) is its equivalent. The desktop sidebar (`NavVertical`) must keep the original `navData` (no public links there). So we build a separate data array only for the drawer. The public items are mapped to `{ title, path, icon }` explicitly because `nav-config-main`'s `NavItemDataProps` and `nav-section`'s `NavItemDataProps` declare incompatible `children` types — a plain spread would fail `tsc`.

- [ ] **Step 1: Build the drawer data with the showcase section**

Inside `DashboardLayout`, right after the `showcaseNav` `useMemo` from Task 2, add:

```tsx
  // Public showcase links live in the header on desktop; on mobile the burger
  // drawer is the header's stand-in, so surface them there as a top section.
  // Sidebar (NavVertical) intentionally keeps the original navData.
  const mobileNavData = useMemo(
    () => [
      {
        subheader: t('main.menu'),
        items: showcaseNav.map(({ title, path, icon }) => ({ title, path, icon })),
      },
      ...navData,
    ],
    [t, showcaseNav, navData]
  );
```

- [ ] **Step 2: Point the burger `NavMobile` at the new data**

In `renderHeader()`, `headerSlots.leftArea`, change the `NavMobile` line from:

```tsx
          <NavMobile data={navData} open={open} onClose={onClose} cssVars={navVars.section} />
```

to:

```tsx
          <NavMobile data={mobileNavData} open={open} onClose={onClose} cssVars={navVars.section} />
```

Leave `renderSidebar()`'s `<NavVertical data={navData} ... />` unchanged.

- [ ] **Step 3: Verify types and lint**

Run: `npx tsc --noEmit`
Expected: 0 errors. (If `tsc` complains about the section item type, confirm Step 1 maps to `{ title, path, icon }` and does not spread the raw item.)

Run: `npx eslint --fix src/layouts/dashboard/layout.tsx && npx eslint src/layouts/dashboard/layout.tsx`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/dashboard/layout.tsx
git commit -m "feat(dashboard): surface public showcase nav in mobile burger drawer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Full verification gates + manual check

**Files:** none (verification only)

- [ ] **Step 1: Run the full gate trio**

Run: `npx tsc --noEmit`
Expected: 0 errors.

Run: `npm run lint`
Expected: 0 errors.

Run: `npm test`
Expected: green (no new tests; existing suite unaffected).

- [ ] **Step 2: Manual UI check (if backend/dev server available)**

Start dev server if not running (`npm run dev`), sign in, then:
- Desktop `/dashboard/*` (vertical nav, default): a horizontal row **Главная · Питомники · Животные · Выставки** appears in the header next to the burger area; clicking each navigates to `/`, `/kennels`, `/animals`, `/shows`.
- Desktop sidebar still has only the dashboard sections — no public links added.
- Narrow viewport (< `lg`): the header row is hidden; open the burger drawer → a **«Сайт»** section at the top lists the same four links; the dashboard sections follow below.
- Switch language EN: header labels read Home · Kennels · Animals · Shows; drawer section header reads **Site**.

Expected: all of the above hold. If horizontal nav mode is toggled in Settings, the public desktop row is intentionally hidden (dashboard nav already occupies the header); the drawer still carries the links on mobile.

- [ ] **Step 3: No commit needed**

This task only verifies; commits happened per task. If lint auto-fixed import order, that was committed in Tasks 2–3.
