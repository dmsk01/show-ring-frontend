# Show Ring — how to build with this library

Show Ring is a Russian-language web platform for dog shows (dogs, kennels, litters, show registration, results). UI copy is Russian.

## Setup — always wrap in the provider

Every screen must render inside `ShowRingThemeProvider`. It applies the MUI theme (palette, typography, shadows, component overrides) and `CssBaseline`; without it every component falls back to stock MUI styling.

```jsx
const { ShowRingThemeProvider, Card, Typography } = window.ShowRingDS;

<ShowRingThemeProvider mode="light">{/* screen */}</ShowRingThemeProvider>
```

## Styling idiom — MUI `sx` + theme tokens, no CSS classes

This is an MUI v7 theme. Style with props and the `sx` prop using theme keys, never raw hex/px:

- Colors: `color="primary" | "secondary" | "info" | "success" | "warning" | "error"`; in `sx`: `'text.primary'`, `'text.secondary'`, `'text.disabled'`, `'primary.main'`, `'background.neutral'`, `'divider'`.
- Typography: `<Typography variant="h1…h6 | subtitle1 | subtitle2 | body1 | body2 | caption | overline | numeric">` — `numeric` (Unbounded 700, tabular-nums) for participant numbers, amounts, scores; weights via `fontWeight: 'fontWeightSemiBold' | 'fontWeightMedium' | 'fontWeightBold'`.
- Spacing: theme units (`p: 3`, `gap: 1.5`, `spacing={2}` = 8px steps). Radius: `borderRadius: 1` (= 2px, one radius for blocks and images; avatars stay round).
- Shadows: rely on `Card`; hover elevation via `cardActionableSx`.
- Theme-only variants: `Button variant="soft"`, `Label variant="soft|filled|outlined|inverted"`, `Avatar color="primary"` (use `color`, not `sx.bgcolor` — it picks a readable text color).

## Semantic tokens — use these, don't pick colors ad hoc

- `STATUS_TONE.neutral | pending | active | progress | danger` → color for `<Label color={…}>` for any lifecycle status (draft / on review / open / in progress / cancelled).
- `PRIORITY_TONE.low | normal | high | urgent`.
- `SEX_COLOR.male | female` → dog sex (`info` / `secondary`); e.g. `iconColor={`${SEX_COLOR.male}.main`}`.

## Project patterns

- Status badge: `<Label color={STATUS_TONE.active}>Регистрация открыта</Label>`.
- Secondary "icon + text" lines (date, place, price, breed): `<MetaRow icon="solar:calendar-date-bold">…</MetaRow>` — icons stay neutral; only sex gets an accent.
- Clickable card: `<Card sx={[cardActionableSx, { p: 3 }]}>` with a `<CardLink href=…>` title.
- Page header: `<CustomBreadcrumbs heading links action />`.
- Tables: `Table` + `TableHeadCustom headCells=[{id,label,align}]`; the primary cell uses `fontWeight: 'fontWeightSemiBold'`.
- Empty state: `<EmptyContent title description action imgUrl=… />` — pass `imgUrl`; the default illustration lives in the app's /public and is absent here. `Logo` has the same limitation.
- Icons: `<Iconify icon="solar:…" />`; prefer icons shown in the Iconify card (registered offline).

## Where the truth lives

Per-component API: `<Name>.d.ts` and `<Name>.prompt.md`; working compositions: each `<Name>.html` preview (Card, Table, Label, MetaRow, CustomBreadcrumbs, Dialog, TextField are the canonical ones).

## Example

```jsx
const { ShowRingThemeProvider, Card, Stack, Label, MetaRow, CardLink, STATUS_TONE, cardActionableSx } = window.ShowRingDS;

<ShowRingThemeProvider>
  <Card sx={[cardActionableSx, { p: 3, maxWidth: 360 }]}>
    <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
      <CardLink href="#" variant="subtitle1">Кубок Москвы 2026</CardLink>
      <Label color={STATUS_TONE.active}>Регистрация открыта</Label>
    </Stack>
    <Stack spacing={1}>
      <MetaRow icon="solar:calendar-date-bold">12 – 13 октября 2026</MetaRow>
      <MetaRow icon="mingcute:location-fill">Москва, Россия</MetaRow>
    </Stack>
  </Card>
</ShowRingThemeProvider>
```
