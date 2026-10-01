# design-sync notes (Show Ring → claude.ai/design)

Project: Show Ring DS — https://claude.ai/design/p/3fe9ad41-4a0a-4354-b81e-2c681306061e

## How this repo is synced

- The frontend is a Next app, not a published package. `.design-sync/pkg/` is a thin
  entry package (`show-ring-ds`): `index.tsx` re-exports the app's real theme + components
  and ~55 MUI components (styled by the app's theme overrides).
- Types: `node .design-sync/build-types.mjs` (cfg.buildCmd) runs tsc into `pkg/types/`
  (gitignored), rewrites `src/*` alias imports to relative paths and hoists the entry
  `.d.ts` (tsc mirrors rootDir; the converter's glob skips dot-dirs). Run it before every build.
- Build: `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --out ./ds-bundle`
  (no `--entry` flag: `cfg.entry` points at `.design-sync/pkg/index.tsx`).
- Groups come from category-only stub docs in `.design-sync/docs/<Name>.md` (cfg.docsDir).
  Adding an export to `pkg/index.tsx` → add a stub doc with its category.
- Root `tsconfig.json` excludes `.design-sync`, `.ds-sync`, `ds-bundle` — the previews import
  `show-ring-ds`, which only the converter resolves; without the exclude `tsc`/`next build` fail.

## Gotchas

- `ShowRingThemeProvider` (in `pkg/index.tsx`) replaces the app's ThemeProvider, which needs
  the settings-drawer and i18n contexts. It calls `createTheme()` with no settings.
- `pkg/process-shim.ts` must stay the first import: `next/link` (via RouterLink) and
  `src/global-config` read `process.env` at module-eval time; the design runtime has no `process`.
- `EmptyContent` and `Logo` load images from the app's `/public` (`CONFIG.assetsDir`) — absent in
  designs. Previews pass `imgUrl` as a data URI; `Logo` stays a floor card.
- `Avatar`: use the theme's `color` prop; `sx.bgcolor` keeps dark text (unreadable).
- `Dialog` preview: `disablePortal hideBackdrop disableAutoFocus transitionDuration={0}` +
  `position: absolute` inside a sized Box; otherwise the card captures blank.
- **Fonts (since 2026-09-29, «Спортивный» theme):** Onest (body, 400–800) + Unbounded (headings/`numeric`,
  600/700), `@fontsource` cyrillic+latin subsets. `cfg.extraFonts` lists the per-subset css files
  (`../../node_modules/@fontsource/{onest,unbounded}/<subset>-<weight>.css`) — keep it in sync with the
  imports in `src/global.css`. The previous Public Sans/Barlow set had no Cyrillic; resolved.
- `fonts/` is not tracked by the `_ds_sync.json` anchor: when a font family is swapped, the diff's
  `deletePaths` stays empty — list the project's `fonts/` and delete stale files explicitly (done for Barlow/Public Sans).
- Unbounded is wide: Label, LinearProgress, TextField, Tabs, Typography tripped `[GRID_OVERFLOW]` and now use
  `cardMode: "column"`.
- The claude.ai/design project also holds `templates/visual-directions/**` (the visual-direction reference,
  incl. `ring-preview.html`) — not produced by this sync; never put it in a plan's deletes.

## Known render warns

- `Logo` — thin (image from /public, see above).
- `IconButton` — thin: authored preview is icon-only (no text); screenshot confirmed fine.
- `CircularProgress`, `Radio` — floor cards render with no text; the components are
  exercised by the `LinearProgress` and `Checkbox` previews.

## Re-sync risks

- `pkg/index.tsx` is a hand-maintained export list — new app components don't appear until added.
- `EmptyContent.tsx` preview inlines `public/assets/icons/empty/ic-content.svg` as base64; if the
  asset changes, regenerate it.
- `process-shim.ts` masks every `process.env.*` read as `undefined` — a component that needs a
  real env value at render would silently misbehave in designs.
- Toolchain at first sync: Node 22.18, TypeScript from the app, playwright 1.60 (chromium-1223).
- Theme overhauls change every render but keep grades (grades follow preview sources): after one, run a
  `--spot-check-components` capture on the core set (Button, Card, Table, Label, Typography, TextField, Dialog…)
  and re-check `conventions.md` for stale values (radius/typography facts).
