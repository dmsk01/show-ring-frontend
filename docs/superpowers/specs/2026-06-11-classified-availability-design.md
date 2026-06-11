# Classified availability (available/reserved/sold) — frontend design

Date: 2026-06-11
Status: approved

## Context

Backend added `Classified.availability` (enum `AnimalAvailability`: `available | reserved | sold`,
migration `a3e9d7c2f1b4`). Verified against live OpenAPI:

- `ClassifiedResponse.availability` — required.
- `ClassifiedUpdate.availability` — optional/nullable (no transition state machine; owner sets freely).
- `ClassifiedCreate` does **not** accept the field (backend defaults to `available`).
- `GET /classifieds?availability=available|reserved|sold` — list filter.
- Status changes go through the existing `PUT /classifieds/{id}` with `{"availability": "..."}`.
- Side finding: `sex` filter on `GET /classifieds` is now implemented on the backend — the stale
  comment in `src/actions/classified.ts` should be removed.

## Decisions (user-approved)

1. **Display everywhere, "available" muted**: badge for `reserved`/`sold` on showcase cards;
   all three states in detail view and the dashboard table (new column).
2. **Showcase filter**: availability select in the filter row, persisted in the URL like the rest.
3. **Editing**: `Field.Select` in the edit form (edit only — create doesn't accept it) **plus**
   quick-change menu items in the dashboard table row popover (PUT with a single field).

## Design

### Types — `src/types/classified.ts`

- `export type AnimalAvailability = 'available' | 'reserved' | 'sold'`
- `export const ANIMAL_AVAILABILITIES: AnimalAvailability[]`
- `IClassifiedItem.availability: AnimalAvailability`
- `IClassifiedUpdate` gains `availability?: AnimalAvailability` (not on `IClassifiedCreate`).

### Utils — `src/sections/classified/classified-utils.ts`

- `classifiedAvailabilityI18nKey(a) => \`enums.availability.${a}\`` (same pattern as category/status).
- `AVAILABILITY_COLOR: Record<AnimalAvailability, LabelColor>` —
  `available: 'success'`, `reserved: 'warning'`, `sold: 'default'` (muted).
  Shared by card / detail / table.

### Display

- **Showcase card** (`classified-card.tsx`): badge only when `availability !== 'available'`,
  stacked at top-left next to the sex label (keeps the grid from being flooded with green).
- **Detail** (`classified-detail-view.tsx`): label for all three states next to the category
  label in the header row.
- **Dashboard table** (`classified-table-row.tsx` + list view head): new "Availability" column
  with a `Label`, all three states.
- Defensive fallback to `available` when the field is missing (legacy rows are migrated, but cheap).

### Editing

- **Edit form** (`classified-create-edit-form.tsx`): `availability` in the zod schema; the
  `Field.Select` renders only when `currentClassified` is present; the field is sent only in the
  update payload.
- **Quick change** (table row popover): three items (Available/Reserved/Sold), current one marked;
  click → handler from the list view → `updateClassified(id, { availability })` + success toast.

### Showcase filter

- `ClassifiedsQuery.availability?: AnimalAvailability` in `src/actions/classified.ts`.
- `ShowcaseFilters.availability: AnimalAvailability | 'all'` (default `all`), seeded from and
  persisted to the URL, select in the filter row.
- Remove the stale `sex`-filter comment in `src/actions/classified.ts`.

### i18n (RU + EN) — `src/locales/langs/{ru,en}/classified.json`

- `enums.availability.{available,reserved,sold}` — EN: Available / Reserved / Sold;
  RU: Свободен / Резерв / Продан.
- `form.fields.availability`, `showcase.availability`, `showcase.anyAvailability`,
  `list.columns.availability`. Quick-change reuses `toast.updated`.

### Tests

- `classified-utils.test.ts`: `classifiedAvailabilityI18nKey` and completeness of
  `AVAILABILITY_COLOR` against `ANIMAL_AVAILABILITIES`.

### Gates

`npx tsc --noEmit`, `npm run lint`, `npm test` — all green before commit.
