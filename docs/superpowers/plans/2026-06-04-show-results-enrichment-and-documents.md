# Show Results Enrichment + Documents Interface — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the show-results table (dog names, breeders, breed/FCI-group, titles) with a switchable grouping selector on both the dashboard and public pages, and build a role-gated documents interface (official catalog/diplomas/certificates/ring-sheets + per-entry diplomas/certificates).

**Architecture:** Client-side enrichment — a pure `buildResultRows` util joins entries+results against reference lists (dogs, kennels, breeds, breed-groups, classes, grades, rings); a pure `groupRows` util buckets rows by the selected key. A reusable `ShowResultsTable` renders grouped sections on both screens. A reusable `ShowDocumentsPanel` drives generation tasks (POST → poll `/tasks/{id}` → download). No backend changes required.

**Tech Stack:** Next.js 16 App Router, React, MUI 7, SWR, TypeScript, Vitest. Backend: ShowTail FastAPI (`/api/*` proxy).

---

## File Structure

**Create:**
- `src/sections/show/show-results-utils.ts` — pure types + `buildResultRows` + `groupRows` (testable, no React).
- `src/sections/show/__tests__/show-results-utils.test.ts` — vitest for the pure utils.
- `src/sections/show/show-results-table.tsx` — reusable grouped results table.
- `src/sections/show/show-documents-panel.tsx` — reusable documents panel (official + task list).

**Modify:**
- `src/types/show-result.ts` — fix `titles_cache` type, add `TitleCacheItem`, `IShowRing`.
- `src/lib/axios.ts` — add `show.rings/documentsReadiness/officialDoc/officialContext/entryOfficialDoc` endpoints.
- `src/actions/show-result.ts` — add `useGetShowRings`, `useShowResultRows`.
- `src/actions/document.ts` — add official/entry generation, `pollTask`, readiness hook; improve `downloadTask` filename.
- `src/types/permissions.ts` — add `'documents'` resource.
- `src/config/permissions.ts` — grant `documents` to `organizer` + `judge`.
- `src/config/__tests__/permissions.test.ts` — assert documents RBAC.
- `src/sections/show/view/show-results-view.tsx` — use `ShowResultsTable` + embed `ShowDocumentsPanel` + per-row individual-doc actions.
- `src/sections/show/view/show-public-detail-view.tsx` — use `ShowResultsTable` read-only.
- `src/sections/show/view/show-documents-view.tsx` — refactor to render shared `ShowDocumentsPanel` (drop legacy duplicate).

**Reference (read-only, do not edit):**
- `src/actions/admin-reference.ts` (`useReferenceList`, `ReferenceRecord`), `src/actions/dog.ts` (`useGetDogs`), `src/actions/kennel.ts` (`useGetKennelsList`), `src/hooks/use-permissions.ts`, `src/auth/hooks` (`useAuthContext().user.id`), `src/sections/show/show-utils.ts` (`SHOW_AWARD_FLAGS`).

---

## Phase A — Results enrichment

### Task 1: Types + endpoints

**Files:**
- Modify: `src/types/show-result.ts`
- Modify: `src/lib/axios.ts:184-194` (the `show:` block)

- [ ] **Step 1: Fix `titles_cache` and add types**

In `src/types/show-result.ts`, add at top (after the existing imports/first line):

```ts
export type TitleCacheItem = { code: string; name: string };

export type IShowRing = {
  id: string;
  show_id: string;
  ring_number: number;
  breed_id: string | null;
  breed_group_id: string | null;
  show_class_id: string | null;
  judge_id: string | null;
  ring_date: string | null;
  time_start: string | null;
  time_end: string | null;
  location: string | null;
};
```

Then change the `titles_cache` field of `IShowResult` from:

```ts
  titles_cache: string | null;
```

to:

```ts
  titles_cache: TitleCacheItem[] | null;
```

- [ ] **Step 2: Add endpoints**

In `src/lib/axios.ts`, inside the `show: { ... }` object, after the `diplomasGenerate` line, add:

```ts
    rings: (id: string) => `/shows/${id}/rings`,
    documentsReadiness: (id: string) => `/shows/${id}/documents/readiness`,
    officialDoc: (id: string, kind: string) => `/shows/${id}/official/${kind}`,
    officialContext: (id: string, kind: string) => `/shows/${id}/official/${kind}/context`,
    entryOfficialDoc: (id: string, entryId: string, kind: string) =>
      `/shows/${id}/entries/${entryId}/official/${kind}`,
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors (the changed `titles_cache` type will surface usages — there are none reading it yet, so it stays green).

- [ ] **Step 4: Commit**

```bash
git add src/types/show-result.ts src/lib/axios.ts
git commit -m "feat(show): result-row types, ring/title types, document endpoints

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Pure enrichment + grouping utils (TDD)

**Files:**
- Create: `src/sections/show/show-results-utils.ts`
- Test: `src/sections/show/__tests__/show-results-utils.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/sections/show/__tests__/show-results-utils.test.ts`:

```ts
import { it, expect, describe } from 'vitest';

import { groupRows, buildResultRows } from '../show-results-utils';

const base = {
  entries: [
    { id: 'e1', show_id: 's', dog_id: 'd1', show_class_id: 'c1', handler_id: null, registered_by: 'u1', catalog_number: 2, notes: null, created_at: '' },
    { id: 'e2', show_id: 's', dog_id: 'd2', show_class_id: 'c1', handler_id: null, registered_by: 'u2', catalog_number: 1, notes: null, created_at: '' },
    { id: 'e3', show_id: 's', dog_id: 'd3', show_class_id: 'c2', handler_id: null, registered_by: 'u1', catalog_number: 3, notes: null, created_at: '' },
  ],
  results: [
    { id: 'r1', show_entry_id: 'e1', judge_id: null, grade_id: 'g1', placement: 2, critique: null, is_class_winner: false, is_best_male: false, is_best_female: false, is_best_of_breed: false, is_best_junior: false, is_best_veteran: false, is_best_in_group: false, is_best_in_show: false, titles_cache: [{ code: 'CW', name: 'Class Winner' }], created_at: '', updated_at: '' },
    { id: 'r2', show_entry_id: 'e2', judge_id: null, grade_id: 'g1', placement: 1, critique: 'good', is_class_winner: true, is_best_male: false, is_best_female: false, is_best_of_breed: false, is_best_junior: false, is_best_veteran: false, is_best_in_group: false, is_best_in_show: false, titles_cache: null, created_at: '', updated_at: '' },
  ],
  dogs: [
    { id: 'd1', name: 'Rex', breed_id: 'b1', kennel_id: 'k1' },
    { id: 'd2', name: 'Bella', breed_id: 'b1', kennel_id: null },
    { id: 'd3', name: 'Max', breed_id: 'b2', kennel_id: 'k1' },
  ],
  kennels: [{ id: 'k1', name: 'Star', kennel_prefix: 'iz Star' }],
  breeds: [
    { id: 'b1', name: 'Poodle', breed_group_id: 'bg1' },
    { id: 'b2', name: 'Boxer', breed_group_id: null },
  ],
  breedGroups: [{ id: 'bg1', number: 9, name: 'Companion' }],
  classes: [{ id: 'c1', name: 'Open' }, { id: 'c2', name: 'Junior' }],
  grades: [{ id: 'g1', name: 'Excellent' }],
  rings: [{ id: 'ring1', ring_number: 5, breed_id: 'b1', breed_group_id: null, show_class_id: 'c1' }],
};

describe('buildResultRows', () => {
  const rows = buildResultRows(base);

  it('joins dog, breed, group, kennel, class, grade', () => {
    const r = rows.find((x) => x.entryId === 'e1')!;
    expect(r.dogName).toBe('Rex');
    expect(r.breedName).toBe('Poodle');
    expect(r.groupLabel).toContain('9');
    expect(r.kennelName).toBe('Star (iz Star)');
    expect(r.className).toBe('Open');
    expect(r.gradeName).toBe('Excellent');
    expect(r.placement).toBe(2);
    expect(r.titles.map((t) => t.code)).toEqual(['CW']);
  });

  it('falls back to placeholders for missing data', () => {
    const r = rows.find((x) => x.entryId === 'e2')!;
    expect(r.kennelName).toBe('—'); // dog has no kennel
    const noRes = rows.find((x) => x.entryId === 'e3')!;
    expect(noRes.gradeName).toBe('—'); // entry has no result
    expect(noRes.groupLabel).toBe('Без группы'); // breed b2 has no group
    expect(noRes.titles).toEqual([]);
  });

  it('matches ring by class + breed, else "Не назначено"', () => {
    expect(rows.find((x) => x.entryId === 'e1')!.ringLabel).toBe('Ринг 5');
    expect(rows.find((x) => x.entryId === 'e3')!.ringLabel).toBe('Не назначено');
  });
});

describe('groupRows', () => {
  const rows = buildResultRows(base);

  it('groups by class (default) sorted, rows by placement', () => {
    const groups = groupRows(rows, 'class');
    expect(groups.map((g) => g.label)).toEqual(['Junior', 'Open']);
    const open = groups.find((g) => g.label === 'Open')!;
    expect(open.rows.map((r) => r.entryId)).toEqual(['e2', 'e1']); // placement 1 then 2
  });

  it('groups by FCI group with "Без группы" bucket last', () => {
    const groups = groupRows(rows, 'group');
    expect(groups[groups.length - 1].label).toBe('Без группы');
  });

  it('groups by ring with "Не назначено" bucket last', () => {
    const groups = groupRows(rows, 'ring');
    expect(groups[groups.length - 1].label).toBe('Не назначено');
  });

  it('groups by breed', () => {
    const groups = groupRows(rows, 'breed');
    expect(groups.map((g) => g.label).sort()).toEqual(['Boxer', 'Poodle']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- show-results-utils`
Expected: FAIL — `Cannot find module '../show-results-utils'`.

- [ ] **Step 3: Implement the util**

Create `src/sections/show/show-results-utils.ts`:

```ts
import type { IShowEntry, IShowResult, TitleCacheItem } from 'src/types/show-result';

// ----------------------------------------------------------------------

export type GroupBy = 'class' | 'breed' | 'group' | 'ring';

export const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'class', label: 'По классам' },
  { value: 'breed', label: 'По породам' },
  { value: 'group', label: 'По группам' },
  { value: 'ring', label: 'По рингам' },
];

export type IShowResultRow = {
  entryId: string;
  catalogNumber: number | null;
  registeredBy: string;
  dogId: string;
  dogName: string;
  breedId: string | null;
  breedName: string;
  groupId: string | null;
  groupNumber: number | null;
  groupLabel: string;
  kennelName: string;
  classId: string | null;
  className: string;
  gradeName: string;
  placement: number | null;
  titles: TitleCacheItem[];
  ringId: string | null;
  ringNumber: number | null;
  ringLabel: string;
  result?: IShowResult;
};

export type ResultGroup = { key: string; label: string; rows: IShowResultRow[] };

// Minimal shapes the util needs — callers pass real API objects (structurally compatible).
type DogLite = { id: string; name: string; breed_id: string | null; kennel_id: string | null };
type KennelLite = { id: string; name: string; kennel_prefix?: string | null };
type BreedLite = { id: string; name: string; breed_group_id?: string | null };
type GroupLite = { id: string; number: number; name: string };
type RefLite = { id: string; name: string };
type RingLite = {
  id: string;
  ring_number: number;
  breed_id?: string | null;
  breed_group_id?: string | null;
  show_class_id?: string | null;
};

export type BuildResultRowsInput = {
  entries: IShowEntry[];
  results: IShowResult[];
  dogs: DogLite[];
  kennels: KennelLite[];
  breeds: BreedLite[];
  breedGroups: GroupLite[];
  classes: RefLite[];
  grades: RefLite[];
  rings: RingLite[];
};

const PLACEHOLDER = '—';

function byId<T extends { id: string }>(list: T[]): Map<string, T> {
  return new Map(list.map((x) => [x.id, x]));
}

export function buildResultRows(input: BuildResultRowsInput): IShowResultRow[] {
  const dogMap = byId(input.dogs);
  const kennelMap = byId(input.kennels);
  const breedMap = byId(input.breeds);
  const groupMap = byId(input.breedGroups);
  const classMap = byId(input.classes);
  const gradeMap = byId(input.grades);
  const resultByEntry = new Map(input.results.map((r) => [r.show_entry_id, r]));

  const findRing = (classId: string, breedId: string | null, groupId: string | null) =>
    input.rings.find(
      (ring) =>
        ring.show_class_id === classId &&
        ((breedId != null && ring.breed_id === breedId) ||
          (groupId != null && ring.breed_group_id === groupId))
    ) ?? null;

  return input.entries.map((entry) => {
    const dog = dogMap.get(entry.dog_id);
    const breed = dog?.breed_id ? breedMap.get(dog.breed_id) : undefined;
    const group = breed?.breed_group_id ? groupMap.get(breed.breed_group_id) : undefined;
    const kennel = dog?.kennel_id ? kennelMap.get(dog.kennel_id) : undefined;
    const result = resultByEntry.get(entry.id);

    const kennelName = kennel
      ? kennel.kennel_prefix
        ? `${kennel.name} (${kennel.kennel_prefix})`
        : kennel.name
      : PLACEHOLDER;

    const ring = findRing(entry.show_class_id, dog?.breed_id ?? null, breed?.breed_group_id ?? null);

    return {
      entryId: entry.id,
      catalogNumber: entry.catalog_number,
      registeredBy: entry.registered_by,
      dogId: entry.dog_id,
      dogName: dog?.name ?? PLACEHOLDER,
      breedId: dog?.breed_id ?? null,
      breedName: breed?.name ?? PLACEHOLDER,
      groupId: group?.id ?? null,
      groupNumber: group?.number ?? null,
      groupLabel: group ? `Группа ${group.number} — ${group.name}` : 'Без группы',
      kennelName,
      classId: entry.show_class_id,
      className: classMap.get(entry.show_class_id)?.name ?? PLACEHOLDER,
      gradeName: result?.grade_id ? (gradeMap.get(result.grade_id)?.name ?? PLACEHOLDER) : PLACEHOLDER,
      placement: result?.placement ?? null,
      titles: result?.titles_cache ?? [],
      ringId: ring?.id ?? null,
      ringNumber: ring?.ring_number ?? null,
      ringLabel: ring ? `Ринг ${ring.ring_number}` : 'Не назначено',
      result,
    };
  });
}

// ----------------------------------------------------------------------

const FALLBACK_KEY = '__none__';

function rowSorter(a: IShowResultRow, b: IShowResultRow): number {
  const pa = a.placement ?? Number.POSITIVE_INFINITY;
  const pb = b.placement ?? Number.POSITIVE_INFINITY;
  if (pa !== pb) return pa - pb;
  return (a.catalogNumber ?? Infinity) - (b.catalogNumber ?? Infinity);
}

export function groupRows(rows: IShowResultRow[], groupBy: GroupBy): ResultGroup[] {
  const buckets = new Map<string, ResultGroup>();
  // numeric sort hint for group/ring; undefined → name sort
  const order = new Map<string, number>();

  for (const row of rows) {
    let key: string;
    let label: string;
    let sortNum: number | undefined;

    if (groupBy === 'class') {
      key = row.classId ?? FALLBACK_KEY;
      label = row.className;
    } else if (groupBy === 'breed') {
      key = row.breedId ?? FALLBACK_KEY;
      label = row.breedName;
    } else if (groupBy === 'group') {
      key = row.groupId ?? FALLBACK_KEY;
      label = row.groupLabel;
      sortNum = row.groupNumber ?? undefined;
    } else {
      key = row.ringId ?? FALLBACK_KEY;
      label = row.ringLabel;
      sortNum = row.ringNumber ?? undefined;
    }

    if (!buckets.has(key)) buckets.set(key, { key, label, rows: [] });
    buckets.get(key)!.rows.push(row);
    if (sortNum !== undefined) order.set(key, sortNum);
  }

  const groups = [...buckets.values()];
  groups.forEach((g) => g.rows.sort(rowSorter));

  groups.sort((a, b) => {
    // fallback bucket always last
    if (a.key === FALLBACK_KEY) return 1;
    if (b.key === FALLBACK_KEY) return -1;
    const na = order.get(a.key);
    const nb = order.get(b.key);
    if (na !== undefined && nb !== undefined) return na - nb;
    return a.label.localeCompare(b.label, 'ru');
  });

  return groups;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- show-results-utils`
Expected: PASS (all cases green).

- [ ] **Step 5: Lint + typecheck**

Run: `npx eslint --fix src/sections/show/show-results-utils.ts src/sections/show/__tests__/show-results-utils.test.ts && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/sections/show/show-results-utils.ts src/sections/show/__tests__/show-results-utils.test.ts
git commit -m "feat(show): pure buildResultRows + groupRows utils with tests

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Data hooks

**Files:**
- Modify: `src/actions/show-result.ts`

- [ ] **Step 1: Add ring + enriched-rows hooks**

In `src/actions/show-result.ts`, add imports at top:

```ts
import type { IShowRing } from 'src/types/show-result';

import { useReferenceList } from 'src/actions/admin-reference';
import { useGetDogs } from 'src/actions/dog';
import { useGetKennelsList } from 'src/actions/kennel';
import { buildResultRows } from 'src/sections/show/show-results-utils';
```

(Keep existing imports; merge type imports into the existing `import type { ... } from 'src/types/show-result'` line.)

Append at the end of the file:

```ts
// ----------------------------------------------------------------------

export function useGetShowRings(showId?: string) {
  const key = showId ? endpoints.show.rings(showId) : null;
  const { data, isLoading, error } = useSWR<IShowRing[]>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ rings: data ?? [], ringsLoading: isLoading, ringsError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

/** Builds enriched, joinable result rows for a show (used by dashboard + public). */
export function useShowResultRows(showId?: string) {
  const { entries, entriesLoading } = useGetShowEntries(showId);
  const { results, resultsLoading } = useGetShowResults(showId);
  const { rings } = useGetShowRings(showId);
  const { dogs, dogsLoading } = useGetDogs({ per_page: 500 });
  const { kennels } = useGetKennelsList({ per_page: 500 });
  const { items: breeds } = useReferenceList('/references/breeds');
  const { items: breedGroups } = useReferenceList('/references/breed-groups');
  const { items: classes } = useReferenceList('/references/show-classes');
  const { items: grades } = useReferenceList('/references/grades');

  const rows = useMemo(
    () =>
      buildResultRows({
        entries,
        results,
        dogs,
        kennels,
        breeds: breeds as never,
        breedGroups: breedGroups as never,
        classes,
        grades,
        rings,
      }),
    [entries, results, dogs, kennels, breeds, breedGroups, classes, grades, rings]
  );

  return {
    rows,
    loading: entriesLoading || resultsLoading || dogsLoading,
    isEmpty: !entriesLoading && entries.length === 0,
  };
}
```

Note: `breeds`/`breedGroups` come from `useReferenceList` as `ReferenceRecord[]` (extra fields in an index signature: `breed_group_id`, `number`). They are structurally compatible with `buildResultRows` input; the `as never` cast bridges the index-signature type to the lite shapes. `useGetKennelsList` exposes `kennels` typed `IKennelItem[]` (has `kennel_prefix`). `useGetDogs` exposes `dogs` typed `IDogItem[]` (has `breed_id`, `kennel_id`).

- [ ] **Step 2: Typecheck + lint**

Run: `npx eslint --fix src/actions/show-result.ts && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/actions/show-result.ts
git commit -m "feat(show): useGetShowRings + useShowResultRows enrichment hooks

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Reusable grouped results table

**Files:**
- Create: `src/sections/show/show-results-table.tsx`

- [ ] **Step 1: Implement the component**

Create `src/sections/show/show-results-table.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';
import type { TableHeadCellProps } from 'src/components/table';
import type { GroupBy, IShowResultRow } from './show-results-utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { useTable, TableNoData, TableHeadCustom } from 'src/components/table';

import { SHOW_AWARD_FLAGS } from './show-utils';
import { groupRows, GROUP_BY_OPTIONS } from './show-results-utils';

// ----------------------------------------------------------------------

type Props = {
  rows: IShowResultRow[];
  loading: boolean;
  groupBy: GroupBy;
  onGroupByChange: (value: GroupBy) => void;
  renderRowActions?: (row: IShowResultRow) => ReactNode;
};

export function ShowResultsTable({ rows, loading, groupBy, onGroupByChange, renderRowActions }: Props) {
  const table = useTable();
  const groups = groupRows(rows, groupBy);

  const head: TableHeadCellProps[] = [
    { id: 'catalog', label: '№', width: 64 },
    { id: 'dog', label: 'Кличка' },
    { id: 'breed', label: 'Порода' },
    { id: 'kennel', label: 'Заводчик' },
    { id: 'class', label: 'Класс', width: 140 },
    { id: 'grade', label: 'Оценка', width: 120 },
    { id: 'placement', label: 'Место', width: 72 },
    { id: 'titles', label: 'Титулы' },
    { id: 'awards', label: 'Награды' },
    ...(renderRowActions ? [{ id: 'actions', label: '', width: 120 }] : []),
  ];

  const colSpan = head.length;

  return (
    <Card>
      <Box sx={{ p: 2 }}>
        <TextField
          select
          size="small"
          label="Группировка"
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
          sx={{ minWidth: 200 }}
        >
          {GROUP_BY_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Scrollbar>
        <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 1080 }}>
          <TableHeadCustom headCells={head} />
          <TableBody>
            {groups.map((group) => (
              <>
                <TableRow key={`g-${group.key}`}>
                  <TableCell colSpan={colSpan} sx={{ bgcolor: 'background.neutral' }}>
                    <Typography variant="subtitle2">{group.label}</Typography>
                  </TableCell>
                </TableRow>

                {group.rows.map((row) => (
                  <TableRow key={row.entryId} hover>
                    <TableCell>{row.catalogNumber ?? '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.dogName}</TableCell>
                    <TableCell>{row.breedName}</TableCell>
                    <TableCell>{row.kennelName}</TableCell>
                    <TableCell>{row.className}</TableCell>
                    <TableCell>{row.gradeName}</TableCell>
                    <TableCell>{row.placement ?? '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ gap: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                        {row.titles.map((t) => (
                          <Label key={t.code} color="info">
                            {t.code}
                          </Label>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ gap: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                        {row.result
                          ? SHOW_AWARD_FLAGS.filter((f) => row.result![f.key]).map((f) => (
                              <Label key={f.label} color="success">
                                {f.label}
                              </Label>
                            ))
                          : null}
                      </Box>
                    </TableCell>
                    {renderRowActions && <TableCell align="right">{renderRowActions(row)}</TableCell>}
                  </TableRow>
                ))}
              </>
            ))}

            <TableNoData notFound={!loading && rows.length === 0} />
          </TableBody>
        </Table>
      </Scrollbar>
    </Card>
  );
}
```

Note: the `<></>` fragment in `.map` needs a key; React requires keyed fragments via `React.Fragment`. Replace the fragment with `<Fragment key={group.key}>` — import `Fragment` from `react` and remove the per-child `key` on the header row. Final corrected wrapper:

```tsx
import { Fragment } from 'react';
// ...
{groups.map((group) => (
  <Fragment key={group.key}>
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ bgcolor: 'background.neutral' }}>
        <Typography variant="subtitle2">{group.label}</Typography>
      </TableCell>
    </TableRow>
    {group.rows.map((row) => ( /* ...as above... */ ))}
  </Fragment>
))}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx eslint --fix src/sections/show/show-results-table.tsx && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/sections/show/show-results-table.tsx
git commit -m "feat(show): reusable grouped ShowResultsTable

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6 (public): Wire public detail view

> Done before the dashboard wiring because it has no row actions (simpler) and validates the table in isolation.

**Files:**
- Modify: `src/sections/show/view/show-public-detail-view.tsx`

- [ ] **Step 1: Replace the inline results table**

In `src/sections/show/view/show-public-detail-view.tsx`:

1. Add state + hook imports near the top imports:

```tsx
import { useState } from 'react';

import type { GroupBy } from '../show-results-utils';

import { useShowResultRows } from 'src/actions/show-result';

import { ShowResultsTable } from '../show-results-table';
```

2. Remove now-unused imports tied to the old table: `useSWR`, `IShowResult` type, `useReferenceList`, `gradeName`, and the MUI `Table/TableHead/TableRow/TableBody/TableCell` imports if no longer used elsewhere in the file (keep `Card`, `Scrollbar` only if still used; the table now lives in `ShowResultsTable`).

3. Inside the component, replace the `results` SWR + grade lookup with:

```tsx
const [groupBy, setGroupBy] = useState<GroupBy>('class');
const { rows, loading: rowsLoading } = useShowResultRows(isCompleted ? id : undefined);
```

4. Replace the entire `<Card>...results table...</Card>` block inside the `{isCompleted && ( ... )}` section with:

```tsx
<ShowResultsTable
  rows={rows}
  loading={rowsLoading}
  groupBy={groupBy}
  onGroupByChange={setGroupBy}
/>
```

(Keep the `<Typography variant="h5">Результаты</Typography>` heading above it.)

- [ ] **Step 2: Typecheck + lint**

Run: `npx eslint --fix src/sections/show/view/show-public-detail-view.tsx && npx tsc --noEmit`
Expected: 0 errors (fix any leftover unused imports the linter flags).

- [ ] **Step 3: Commit**

```bash
git add src/sections/show/view/show-public-detail-view.tsx
git commit -m "feat(show): enriched grouped results on public show page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase B — Documents

### Task 7: RBAC `documents` resource (TDD)

**Files:**
- Modify: `src/types/permissions.ts:5-16`
- Modify: `src/config/permissions.ts:12-16`
- Test: `src/config/__tests__/permissions.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/config/__tests__/permissions.test.ts` (inside the existing top-level `describe`, or add a new `describe`):

```ts
import { can } from 'src/utils/permissions';
import { getPermissionsForRole } from 'src/utils/permissions';

describe('documents permission', () => {
  it('organizer and judge can create documents', () => {
    expect(can('documents:create', getPermissionsForRole('organizer'))).toBe(true);
    expect(can('documents:create', getPermissionsForRole('judge'))).toBe(true);
  });
  it('admin (wildcard) can create documents', () => {
    expect(can('documents:create', getPermissionsForRole('admin'))).toBe(true);
  });
  it('buyer and breeder cannot create documents', () => {
    expect(can('documents:create', getPermissionsForRole('buyer'))).toBe(false);
    expect(can('documents:create', getPermissionsForRole('breeder'))).toBe(false);
  });
});
```

(If `can`/`getPermissionsForRole` are already imported at the top of the test file, do not duplicate the imports.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- config/__tests__/permissions`
Expected: FAIL — organizer/judge return `false` (documents not granted yet); also a TS error that `'documents:create'` is not assignable to `Permission`.

- [ ] **Step 3: Add the resource + grants**

In `src/types/permissions.ts`, add `'documents'` to the `Resource` union (after `'results'`):

```ts
  | 'results'
  | 'documents'
```

In `src/config/permissions.ts`, add `'documents'` to `organizer` and `judge`:

```ts
  organizer: ['dashboard:view', 'shows', 'results', 'documents', 'references:view', 'ads', 'kennels:view', 'litters:view', 'classifieds:view', 'support:view', 'support:create'],
  judge: ['dashboard:view', 'shows:view', 'results:create', 'results:edit', 'documents', 'references:view', 'kennels:view', 'litters:view', 'classifieds:view', 'support:view', 'support:create'],
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- config/__tests__/permissions`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/permissions.ts src/config/permissions.ts src/config/__tests__/permissions.test.ts
git commit -m "feat(rbac): documents resource granted to organizer + judge

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Document actions + endpoints

**Files:**
- Modify: `src/actions/document.ts`

- [ ] **Step 1: Add official/entry generation, polling, readiness; improve download**

In `src/actions/document.ts`:

1. Replace the `generateCatalog`/`generateDiplomas` pair with a generic official generator (keep both names removed — they are only used by `ShowDocumentsView`, refactored in Task 10). Add:

```ts
export type OfficialKind = 'catalog' | 'diplomas' | 'certificates' | 'ring-sheets';
export type EntryDocKind = 'diploma' | 'certificates';

export async function generateOfficial(
  showId: string,
  kind: OfficialKind,
  ringId?: string
): Promise<{ id: string; status: TaskStatus }> {
  const res = await axios.post(
    endpoints.show.officialDoc(showId, kind),
    null,
    ringId ? { params: { ring_id: ringId } } : undefined
  );
  return { id: res.data.id ?? res.data.task_id, status: res.data.status };
}

export async function generateEntryDocument(
  showId: string,
  entryId: string,
  kind: EntryDocKind
): Promise<{ id: string; status: TaskStatus }> {
  const res = await axios.post(endpoints.show.entryOfficialDoc(showId, entryId, kind));
  return { id: res.data.id ?? res.data.task_id, status: res.data.status };
}
```

2. Add a readiness hook:

```ts
export function useDocumentsReadiness(showId?: string) {
  const { data, isLoading } = useSWR<Record<string, unknown>>(
    showId ? endpoints.show.documentsReadiness(showId) : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { readiness: data ?? {}, readinessLoading: isLoading };
}
```

3. Add imperative polling + download-by-task (used by per-row actions):

```ts
export async function pollTask(
  taskId: string,
  { intervalMs = 1500, timeoutMs = 120000 }: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<TaskStatus> {
  const deadline = Date.now() + timeoutMs;
  // eslint-disable-next-line no-await-in-loop
  while (Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    const res = await axios.get<RawTask>(endpoints.task.details(taskId));
    const status = res.data.status;
    if (status === 'done' || status === 'failed') return status;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return 'processing';
}
```

4. Improve `downloadTask` to honour `Content-Disposition`:

```ts
function parseFilename(disposition?: string): string | null {
  if (!disposition) return null;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(disposition);
  if (star) return decodeURIComponent(star[1].replace(/["']/g, ''));
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : null;
}

export async function downloadTask(taskId: string, fallbackName: string): Promise<void> {
  const res = await axios.get(endpoints.task.download(taskId), { responseType: 'blob' });
  const name = parseFilename(res.headers['content-disposition'] as string | undefined) ?? fallbackName;
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
```

Note: `axios` and `fetcher` are already imported. `RawTask` and `TaskStatus` already exist in this file. Remove the now-deleted `generateCatalog`/`generateDiplomas` exports (Task 10 stops importing them).

- [ ] **Step 2: Typecheck + lint**

Run: `npx eslint --fix src/actions/document.ts && npx tsc --noEmit`
Expected: errors only from `show-documents-view.tsx` still importing the removed functions — that file is fixed in Task 10. If you want a green checkpoint now, do Task 10 before re-running `tsc`. Otherwise proceed.

- [ ] **Step 3: Commit**

```bash
git add src/actions/document.ts
git commit -m "feat(documents): official/entry generation, task polling, filename from header

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Reusable documents panel

**Files:**
- Create: `src/sections/show/show-documents-panel.tsx`

- [ ] **Step 1: Implement the panel**

Create `src/sections/show/show-documents-panel.tsx`:

```tsx
'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { usePermissions } from 'src/hooks/use-permissions';

import { useGetShowRings } from 'src/actions/show-result';
import { useGetTask, downloadTask, generateOfficial } from 'src/actions/document';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import type { OfficialKind } from 'src/actions/document';

// ----------------------------------------------------------------------

type GeneratedTask = { id: string; label: string; filename: string };

const STATUS_COLOR = {
  pending: 'warning',
  processing: 'info',
  done: 'success',
  failed: 'error',
} as const;

function TaskItem({ task }: { task: GeneratedTask }) {
  const { status } = useGetTask(task.id);

  const handleDownload = async () => {
    try {
      await downloadTask(task.id, task.filename);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось скачать');
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        gap: 2,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 1,
        border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
      }}
    >
      <Iconify icon="solar:file-text-bold" width={24} />
      <Typography variant="subtitle2" sx={{ flex: 1 }}>
        {task.label}
      </Typography>
      <Label color={status ? STATUS_COLOR[status] : 'default'}>{status ?? 'pending'}</Label>
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        disabled={status !== 'done'}
        startIcon={<Iconify icon="solar:download-bold" />}
        onClick={handleDownload}
      >
        Скачать
      </Button>
    </Box>
  );
}

const OFFICIAL_BUTTONS: { kind: OfficialKind; label: string; icon: string }[] = [
  { kind: 'catalog', label: 'Каталог', icon: 'solar:bill-list-bold' },
  { kind: 'diplomas', label: 'Дипломы', icon: 'solar:cup-star-bold' },
  { kind: 'certificates', label: 'Сертификаты', icon: 'solar:medal-ribbon-star-bold' },
];

type Props = { showId: string };

export function ShowDocumentsPanel({ showId }: Props) {
  const { can } = usePermissions();
  const canGenerate = can('documents:create');
  const { rings } = useGetShowRings(showId);

  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [busy, setBusy] = useState(false);
  const [ringId, setRingId] = useState('');

  const run = async (kind: OfficialKind, label: string, ring?: string) => {
    setBusy(true);
    try {
      const task = await generateOfficial(showId, kind, ring);
      setTasks((prev) => [{ id: task.id, label, filename: `${kind}-${showId}.docx` }, ...prev]);
      toast.success('Генерация запущена');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось запустить генерацию');
    } finally {
      setBusy(false);
    }
  };

  if (!canGenerate) return null;

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Документы выставки
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {OFFICIAL_BUTTONS.map((b) => (
          <Button
            key={b.kind}
            variant="contained"
            color="inherit"
            loading={busy}
            startIcon={<Iconify icon={b.icon} />}
            onClick={() => run(b.kind, b.label)}
          >
            {b.label}
          </Button>
        ))}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          label="Ринг"
          value={ringId}
          onChange={(e) => setRingId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">—</MenuItem>
          {rings.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              Ринг {r.ring_number}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          color="inherit"
          loading={busy}
          disabled={!ringId}
          startIcon={<Iconify icon="solar:document-bold" />}
          onClick={() => run('ring-sheets', `Ринг-лист (ринг ${ringId})`, ringId)}
        >
          Ринг-листы
        </Button>
      </Stack>

      {tasks.length ? (
        <Stack spacing={1.5}>
          {tasks.map((task, i) => (
            <TaskItem key={`${task.id}-${i}`} task={task} />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Документы ещё не сгенерированы. Используйте кнопки выше.
        </Typography>
      )}
    </Card>
  );
}
```

Note: confirm `solar:medal-ribbon-star-bold` and `solar:document-bold` are registered in `src/components/iconify/icon-sets.ts`; if not, either add them to the registry or swap for already-registered icons (e.g. reuse `solar:file-text-bold`). `tsc` will fail on unregistered icon names.

- [ ] **Step 2: Typecheck + lint**

Run: `npx eslint --fix src/sections/show/show-documents-panel.tsx && npx tsc --noEmit`
Expected: 0 errors (resolve icon-registry errors per the note above).

- [ ] **Step 3: Commit**

```bash
git add src/sections/show/show-documents-panel.tsx
git commit -m "feat(documents): reusable ShowDocumentsPanel (official generation)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5 (dashboard): Wire dashboard results view + per-row individual docs

**Files:**
- Modify: `src/sections/show/view/show-results-view.tsx`

- [ ] **Step 1: Rebuild the view on the shared components**

Replace the body of `src/sections/show/view/show-results-view.tsx` with:

```tsx
'use client';

import type { IShowEntry } from 'src/types/show-result';
import type { GroupBy, IShowResultRow } from '../show-results-utils';

import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';

import { usePermissions } from 'src/hooks/use-permissions';

import { useGetShow } from 'src/actions/show';
import { DashboardContent } from 'src/layouts/dashboard';
import { useReferenceList } from 'src/actions/admin-reference';
import { useShowResultRows, useGetShowEntries } from 'src/actions/show-result';
import { generateEntryDocument, pollTask, downloadTask } from 'src/actions/document';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { ShowResultDialog } from '../show-result-dialog';
import { ShowResultsTable } from '../show-results-table';
import { ShowDocumentsPanel } from '../show-documents-panel';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ShowResultsView({ id }: Props) {
  const { can } = usePermissions();
  const { user } = useAuthContext();
  const canEdit = can('results:create') || can('results:edit');
  const canGenerate = can('documents:create');

  const { show } = useGetShow(id);
  const { entries } = useGetShowEntries(id);
  const { rows, loading } = useShowResultRows(id);
  const { items: grades } = useReferenceList('/references/grades');

  const [groupBy, setGroupBy] = useState<GroupBy>('class');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const dialog = useBoolean();
  const [editingEntry, setEditingEntry] = useState<IShowEntry | undefined>(undefined);

  const entryById = new Map(entries.map((e) => [e.id, e]));

  const handleEdit = (entryId: string) => {
    const entry = entryById.get(entryId);
    if (!entry) return;
    setEditingEntry(entry);
    dialog.onTrue();
  };

  const handleDownloadDiploma = async (row: IShowResultRow) => {
    setDownloadingId(row.entryId);
    try {
      const task = await generateEntryDocument(id, row.entryId, 'diploma');
      const status = await pollTask(task.id);
      if (status !== 'done') throw new Error('Документ не готов');
      await downloadTask(task.id, `diploma-${row.entryId}.docx`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось получить документ');
    } finally {
      setDownloadingId(null);
    }
  };

  const renderRowActions = (row: IShowResultRow) => {
    const isOwner = !!user && row.registeredBy === user.id;
    return (
      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
        {canEdit && (
          <Button
            size="small"
            color="inherit"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={() => handleEdit(row.entryId)}
          >
            {row.result ? 'Изм.' : 'Оценка'}
          </Button>
        )}
        {(canGenerate || isOwner) && (
          <Button
            size="small"
            color="inherit"
            loading={downloadingId === row.entryId}
            startIcon={<Iconify icon="solar:download-bold" />}
            onClick={() => handleDownloadDiploma(row)}
          >
            Диплом
          </Button>
        )}
      </Stack>
    );
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={show ? `Результаты — ${show.name}` : 'Результаты'}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Выставки', href: paths.dashboard.shows.root },
          { name: 'Результаты' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <ShowDocumentsPanel showId={id} />

        <ShowResultsTable
          rows={rows}
          loading={loading}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          renderRowActions={renderRowActions}
        />
      </Stack>

      {dialog.value && editingEntry && (
        <ShowResultDialog
          showId={id}
          entry={editingEntry}
          result={rows.find((r) => r.entryId === editingEntry.id)?.result}
          gradeOptions={grades}
          open={dialog.value}
          onClose={dialog.onFalse}
        />
      )}
    </DashboardContent>
  );
}
```

Note: `useAuthContext().user` carries `/users/me` (includes `id`). The diploma button shows for the entry owner (`registered_by === user.id`) or anyone with `documents:create`.

- [ ] **Step 2: Typecheck + lint**

Run: `npx eslint --fix src/sections/show/view/show-results-view.tsx && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/sections/show/view/show-results-view.tsx
git commit -m "feat(show): dashboard results on shared table + documents panel + per-row diploma

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Refactor legacy documents route to shared panel

**Files:**
- Modify: `src/sections/show/view/show-documents-view.tsx`

- [ ] **Step 1: Replace the legacy body with the shared panel**

Replace the whole file `src/sections/show/view/show-documents-view.tsx` with:

```tsx
'use client';

import { paths } from 'src/routes/paths';

import { useGetShow } from 'src/actions/show';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ShowDocumentsPanel } from '../show-documents-panel';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ShowDocumentsView({ id }: Props) {
  const { show } = useGetShow(id);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={show ? `Документы — ${show.name}` : 'Документы'}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Выставки', href: paths.dashboard.shows.root },
          { name: 'Документы' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ShowDocumentsPanel showId={id} />
    </DashboardContent>
  );
}
```

This removes the legacy `generateCatalog`/`generateDiplomas` usages (deleted in Task 8) and the duplicated `TaskItem`.

- [ ] **Step 2: Full typecheck + lint + tests**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green. Fix any remaining unused imports (e.g. in `show-public-detail-view.tsx`).

- [ ] **Step 3: Commit**

```bash
git add src/sections/show/view/show-documents-view.tsx
git commit -m "refactor(documents): legacy documents route reuses ShowDocumentsPanel

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm test` → green
- [ ] Manual (backend `:8000` up): open `/dashboard/shows/{id}/results` — grouping selector switches class/breed/group/ring; columns show dog/breeder/breed/titles; documents panel generates + downloads (organizer/judge/admin); public completed-show page shows the enriched grouped table.

## Notes / known limitations

- `dogs`/`kennels` fetched with `per_page: 500`; very large shows may exceed this (documented limitation; backend enrichment in the spec's optional appendix removes the need for client joins).
- Ring matching is heuristic (class + breed/group); unmatched entries bucket into "Не назначено". Optional backend `entry.ring_id` (spec appendix) makes this deterministic.
- `documents/readiness` is auth-gated and returns an untyped object; `useDocumentsReadiness` reads it defensively (not surfaced in the panel UI in this iteration — available for future enable/disable of buttons).
```
