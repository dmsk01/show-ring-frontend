# "My Shows" Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the «Мои выставки» participant section — a drill-down (shows grid → show detail → my entries → edit entry) with tabs (all/active/past), pagination, RBAC (`dogs:view`), and full RU+EN i18n.

**Architecture:** Next.js 16 App Router + MUI 7 + TypeScript on the Minimal Kit template. New SWR action `useMyShows` reads the backend aggregate `GET /shows/entries/my`; the list view mirrors the existing `ShowShowcaseView` (tabs + card grid + `TablePagination`). The detail view reuses `useMyShowEntries` (now enriched with names) and adds per-entry edit (dialog → `PATCH`) / delete (`ConfirmDialog` → `DELETE`), gated by `canRegisterForShow`. Two `page.tsx` routes wrap views in `PermissionGuard permission="dogs:view"`. Nav links added to both the AccountDrawer and the left dashboard menu.

**Tech Stack:** Next 16, React, MUI 7, SWR, react-hook-form + zod, i18next, vitest. Repo: `E:\Coding\show-ring-frontend`.

**Depends on:** backend plan `E:\Coding\python-animal-platform\docs\plans\2026-06-09-my-shows-backend.md` (contract). Code is verifiable offline (tsc/lint/test); runtime checks need `:8000/health/` green.

**Gates (must be zero before each commit and at the end):**
- `npx tsc --noEmit` → 0 errors
- `npm run lint` → 0 errors (sort imports: `npx eslint --fix <files>`)
- `npm test` → green

---

## File Structure

- `src/routes/paths.ts` — add `dashboard.myShows`.
- `src/lib/axios.ts` — add `show.myShowsList`, `show.entryItem`.
- `src/types/show.ts` — add `IMyShowItem`, `IMyShowPage`, `MyShowStatusGroup`.
- `src/types/show-entry.ts` — enrich `IShowEntry`, add `IShowEntryUpdate`.
- `src/actions/my-show.ts` — new: `useMyShows`.
- `src/actions/show-entry.ts` — add `updateShowEntry`, `deleteShowEntry`.
- `src/sections/my-show/my-show-card.tsx` — card per show (+ entries-count chip).
- `src/sections/my-show/my-show-card-grid.tsx` — grid wrapper.
- `src/sections/my-show/my-show-utils.ts` — pure helpers (`isEntryEditable`, `registeredClassIds`) + unit tests.
- `src/sections/my-show/view/my-shows-list-view.tsx` — tabs + grid + pagination.
- `src/sections/my-show/view/my-show-detail-view.tsx` — show header + my entries list + actions.
- `src/sections/my-show/my-show-entry-edit-dialog.tsx` — edit dialog.
- `src/sections/my-show/view/index.ts` — barrel.
- `src/app/dashboard/my-shows/page.tsx` + `src/app/dashboard/my-shows/[id]/page.tsx` — routes.
- `src/layouts/nav-config-account.tsx` — drawer link.
- `src/layouts/nav-config-dashboard.tsx` — left-menu link.
- `src/locales/langs/{ru,en}/show.json` — `myShows.*`.
- `src/locales/langs/{ru,en}/account.json` — `drawer.myShows`.
- `src/locales/langs/{ru,en}/navbar.json` — `showtail.myShows`.

---

## Task 1: Routes & endpoints

**Files:**
- Modify: `src/routes/paths.ts` (dashboard object, after `shows: {...}` ~line 158)
- Modify: `src/lib/axios.ts` (endpoints.show ~line 189-208)

- [ ] **Step 1: Add the path**

In `src/routes/paths.ts`, inside `dashboard`, after the `shows: { ... }` block:

```ts
    myShows: {
      root: `${ROOTS.DASHBOARD}/my-shows`,
      details: (id: string) => `${ROOTS.DASHBOARD}/my-shows/${id}`,
    },
```

- [ ] **Step 2: Add endpoints**

In `src/lib/axios.ts`, inside `endpoints.show`, add:

```ts
    myShowsList: '/shows/entries/my',
    entryItem: (id: string, entryId: string) => `/shows/${id}/entries/${entryId}`,
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/paths.ts src/lib/axios.ts
git commit -m "feat(my-shows): paths + endpoints for my-shows aggregate and entry item"
```

---

## Task 2: Types

**Files:**
- Modify: `src/types/show.ts`
- Modify: `src/types/show-entry.ts`

- [ ] **Step 1: Extend show types**

Append to `src/types/show.ts`:

```ts
export type IMyShowItem = IShowItem & { my_entries_count: number };

export type IMyShowPage = {
  items: IMyShowItem[];
  total: number;
  page: number;
  per_page: number;
};

export type MyShowStatusGroup = 'all' | 'active' | 'past';
```

- [ ] **Step 2: Enrich entry types**

In `src/types/show-entry.ts`, add the three name fields to `IShowEntry` and a new update type:

```ts
export type IShowEntry = {
  id: string;
  show_id: string;
  dog_id: string;
  show_class_id: string;
  handler_id: string | null;
  registered_by: string;
  catalog_number: number | null;
  notes: string | null;
  created_at: string;
  // enriched by GET /shows/{id}/entries/my and PATCH
  dog_name: string;
  class_code: string;
  class_name: string;
};

export type IShowEntryUpdate = {
  show_class_id?: string;
  handler_id?: string | null;
  notes?: string | null;
};
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: 0 errors. (The only `IShowEntry` consumer is `show-register-view.tsx`, which reads `dog_id`/`catalog_number` — adding fields does not break it.)

- [ ] **Step 4: Commit**

```bash
git add src/types/show.ts src/types/show-entry.ts
git commit -m "feat(my-shows): types for my-show item/page and entry update"
```

---

## Task 3: Actions

**Files:**
- Create: `src/actions/my-show.ts`
- Modify: `src/actions/show-entry.ts`

- [ ] **Step 1: Create `useMyShows`**

Create `src/actions/my-show.ts`:

```ts
import type { SWRConfiguration } from 'swr';
import type { IMyShowPage, MyShowStatusGroup } from 'src/types/show';

import { useMemo } from 'react';
import useSWR from 'swr';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

type MyShowsQuery = {
  statusGroup: MyShowStatusGroup;
  page: number; // 1-based
  perPage?: number;
};

export function useMyShows({ statusGroup, page, perPage = 12 }: MyShowsQuery) {
  const params = { status_group: statusGroup, page, per_page: perPage };
  const key: [string, { params: typeof params }] = [endpoints.show.myShowsList, { params }];

  const { data, isLoading, error, isValidating } = useSWR<IMyShowPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      items: data?.items ?? [],
      total: data?.total ?? 0,
      isLoading,
      error,
      isEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
    }),
    [data, error, isLoading, isValidating]
  );
}
```

- [ ] **Step 2: Add `updateShowEntry` + `deleteShowEntry`**

In `src/actions/show-entry.ts`, update the type import and append the two functions:

```ts
// update the import line:
import type { IShowEntry, IShowEntryCreate, IShowEntryUpdate, IAvailableClasses } from 'src/types/show-entry';
```

```ts
export async function updateShowEntry(
  showId: string,
  entryId: string,
  payload: IShowEntryUpdate
): Promise<IShowEntry> {
  const res = await axios.patch<IShowEntry>(endpoints.show.entryItem(showId, entryId), payload);
  await mutate(endpoints.show.myEntries(showId));
  await mutate(endpoints.show.myShowsList);
  return res.data;
}

export async function deleteShowEntry(showId: string, entryId: string): Promise<void> {
  await axios.delete(endpoints.show.entryItem(showId, entryId));
  await mutate(endpoints.show.myEntries(showId));
  await mutate(
    (key) => Array.isArray(key) && key[0] === endpoints.show.myShowsList
  );
}
```

> `mutate` and `axios` are already imported in `show-entry.ts`. The `myShowsList` SWR key is the array `[url, {params}]`, so revalidate it with the predicate form (matches any params).

- [ ] **Step 3: Verify**

Run: `npx eslint --fix src/actions/my-show.ts src/actions/show-entry.ts && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/actions/my-show.ts src/actions/show-entry.ts
git commit -m "feat(my-shows): actions useMyShows + update/delete entry"
```

---

## Task 4: Pure helpers + unit tests

**Files:**
- Create: `src/sections/my-show/my-show-utils.ts`
- Test: `src/sections/my-show/__tests__/my-show-utils.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/sections/my-show/__tests__/my-show-utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

import { isEntryEditable, registeredClassIds } from '../my-show-utils';

describe('isEntryEditable', () => {
  it('true when registration_open and no deadline', () => {
    expect(isEntryEditable('registration_open', null)).toBe(true);
  });
  it('false when registration_closed', () => {
    expect(isEntryEditable('registration_closed', null)).toBe(false);
  });
  it('false when deadline passed', () => {
    expect(isEntryEditable('registration_open', '2000-01-01')).toBe(false);
  });
});

describe('registeredClassIds', () => {
  it('collects class ids for a dog excluding the edited entry', () => {
    const entries = [
      { id: 'e1', dog_id: 'd1', show_class_id: 'c1' },
      { id: 'e2', dog_id: 'd1', show_class_id: 'c2' },
      { id: 'e3', dog_id: 'd2', show_class_id: 'c3' },
    ] as any;
    expect(registeredClassIds(entries, 'd1', 'e1')).toEqual(new Set(['c2']));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- my-show-utils`
Expected: FAIL — cannot find module `../my-show-utils`.

- [ ] **Step 3: Implement helpers**

Create `src/sections/my-show/my-show-utils.ts`:

```ts
import type { ShowStatus } from 'src/types/show';
import type { IShowEntry } from 'src/types/show-entry';

import { canRegisterForShow } from 'src/sections/show/show-utils';

/** Запись можно редактировать/удалять только пока регистрация открыта. */
export function isEntryEditable(
  status: ShowStatus,
  registrationDeadline: string | null
): boolean {
  return canRegisterForShow(status, registrationDeadline);
}

/**
 * Классы, на которые эта собака уже записана, кроме редактируемой записи —
 * чтобы в диалоге не дать выбрать дублирующий класс.
 */
export function registeredClassIds(
  entries: Pick<IShowEntry, 'id' | 'dog_id' | 'show_class_id'>[],
  dogId: string,
  excludeEntryId: string
): Set<string> {
  return new Set(
    entries
      .filter((e) => e.dog_id === dogId && e.id !== excludeEntryId)
      .map((e) => e.show_class_id)
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- my-show-utils`
Expected: PASS (5 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/sections/my-show/my-show-utils.ts src/sections/my-show/__tests__/my-show-utils.test.ts
git commit -m "feat(my-shows): pure helpers isEntryEditable + registeredClassIds (tested)"
```

---

## Task 5: MyShowCard + grid

**Files:**
- Create: `src/sections/my-show/my-show-card.tsx`
- Create: `src/sections/my-show/my-show-card-grid.tsx`

- [ ] **Step 1: Create the card**

Mirror `src/sections/show/show-card.tsx`, link to the my-shows detail route, add an entries-count chip. Create `src/sections/my-show/my-show-card.tsx`:

```tsx
'use client';

import type { CardProps } from '@mui/material/Card';
import type { IMyShowItem } from 'src/types/show';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CardLink, cardActionableSx } from 'src/components/card-link';

import { SHOW_STATUS_COLOR, showStatusI18nKey } from 'src/sections/show/show-utils';

// ----------------------------------------------------------------------

type Props = CardProps & { show: IMyShowItem };

export function MyShowCard({ show, sx, ...other }: Props) {
  const { t } = useTranslate('show');
  const detailsHref = paths.dashboard.myShows.details(show.id);
  const dates = show.date_end
    ? `${fDate(show.date_start)} – ${fDate(show.date_end)}`
    : fDate(show.date_start);
  const location = [show.city, show.country].filter(Boolean).join(', ') || '—';

  return (
    <Card sx={[cardActionableSx, { p: 3 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
        <CardLink href={detailsHref} variant="subtitle1">
          {show.name}
        </CardLink>
        <Label color={SHOW_STATUS_COLOR[show.status] ?? 'default'}>
          {t(showStatusI18nKey(show.status))}
        </Label>
      </Stack>

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', typography: 'body2' }}>
          <Iconify icon="solar:calendar-date-bold" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {dates}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', typography: 'body2' }}>
          <Iconify icon="mingcute:location-fill" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {location}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', typography: 'body2' }}>
          <Iconify icon="solar:users-group-rounded-bold" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('myShows.card.entriesCount', { count: show.my_entries_count })}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}
```

> Verify both icons (`solar:calendar-date-bold`, `mingcute:location-fill`, `solar:users-group-rounded-bold`) are in `src/components/iconify/icon-sets.ts`. The first two are used by `show-card.tsx` already. If `solar:users-group-rounded-bold` is absent, register it (the `-duotone` variant exists) or reuse a registered one.

- [ ] **Step 2: Create the grid**

Create `src/sections/my-show/my-show-card-grid.tsx`:

```tsx
import type { IMyShowItem } from 'src/types/show';

import Box from '@mui/material/Box';

import { MyShowCard } from './my-show-card';

// ----------------------------------------------------------------------

type Props = { shows: IMyShowItem[] };

export function MyShowCardGrid({ shows }: Props) {
  return (
    <Box
      sx={{
        gap: 3,
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
      }}
    >
      {shows.map((show) => (
        <MyShowCard key={show.id} show={show} />
      ))}
    </Box>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx eslint --fix src/sections/my-show/my-show-card.tsx src/sections/my-show/my-show-card-grid.tsx && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/sections/my-show/my-show-card.tsx src/sections/my-show/my-show-card-grid.tsx
git commit -m "feat(my-shows): MyShowCard + grid"
```

---

## Task 6: List view (tabs + grid + pagination)

**Files:**
- Create: `src/sections/my-show/view/my-shows-list-view.tsx`
- Create: `src/sections/my-show/view/index.ts`

- [ ] **Step 1: Create the list view**

Mirror `src/sections/show/view/show-showcase-view.tsx`, but with 3 tabs, `useMyShows`, `DashboardContent`, and `CustomBreadcrumbs`. Create `src/sections/my-show/view/my-shows-list-view.tsx`:

```tsx
'use client';

import type { MyShowStatusGroup } from 'src/types/show';

import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useTranslate } from 'src/locales';
import { useMyShows } from 'src/actions/my-show';

import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { MyShowCardGrid } from '../my-show-card-grid';

// ----------------------------------------------------------------------

const TABS: MyShowStatusGroup[] = ['all', 'active', 'past'];

export function MyShowsListView() {
  const { t } = useTranslate('show');
  const [group, setGroup] = useState<MyShowStatusGroup>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const { items, total, isLoading, isEmpty } = useMyShows({
    statusGroup: group,
    page: page + 1,
    perPage: rowsPerPage,
  });

  const handleGroup = (_e: React.SyntheticEvent, value: MyShowStatusGroup) => {
    setGroup(value);
    setPage(0);
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('myShows.title')}
        links={[{ name: t('myShows.breadcrumb'), href: paths.dashboard.myShows.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={group} onChange={handleGroup} sx={{ mb: { xs: 3, md: 5 } }}>
        {TABS.map((value) => (
          <Tab key={value} value={value} label={t(`myShows.tabs.${value}`)} />
        ))}
      </Tabs>

      {isLoading ? (
        <LoadingScreen />
      ) : isEmpty ? (
        <EmptyContent
          filled
          title={t('myShows.empty.title')}
          description={t('myShows.empty.description')}
          sx={{ py: 10 }}
        />
      ) : (
        <>
          <MyShowCardGrid shows={items} />
          <TablePagination
            component="div"
            page={page}
            count={total}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[12, 24, 48]}
            onPageChange={(_e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{ mt: 3 }}
          />
        </>
      )}
    </DashboardContent>
  );
}
```

> Confirm `DashboardContent` is exported from `src/layouts/dashboard` and `CustomBreadcrumbs` from `src/components/custom-breadcrumbs` (both used widely, e.g. in `src/sections/dog/view`). If an import path differs, copy the exact import line from `src/sections/dog/view/dog-list-view.tsx`.

- [ ] **Step 2: Create the barrel**

Create `src/sections/my-show/view/index.ts`:

```ts
export * from './my-shows-list-view';
export * from './my-show-detail-view';
```

> `my-show-detail-view` is created in Task 7; the barrel referencing it now is fine because Task 7 follows immediately. If running tasks out of order, create the detail view first.

- [ ] **Step 3: Verify**

Run: `npx eslint --fix src/sections/my-show/view/my-shows-list-view.tsx && npx tsc --noEmit`
Expected: tsc may error only on the not-yet-created detail view import in the barrel — proceed to Task 7, then re-run. The list view file itself must be clean.

- [ ] **Step 4: Commit**

```bash
git add src/sections/my-show/view/my-shows-list-view.tsx src/sections/my-show/view/index.ts
git commit -m "feat(my-shows): list view with tabs, grid, pagination"
```

---

## Task 7: Detail view + edit dialog

**Files:**
- Create: `src/sections/my-show/my-show-entry-edit-dialog.tsx`
- Create: `src/sections/my-show/view/my-show-detail-view.tsx`

- [ ] **Step 1: Create the edit dialog**

Create `src/sections/my-show/my-show-entry-edit-dialog.tsx`:

```tsx
'use client';

import type { IShowItem } from 'src/types/show';
import type { IShowEntry } from 'src/types/show-entry';

import * as z from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { updateShowEntry } from 'src/actions/show-entry';
import { useAvailableClasses } from 'src/actions/show-entry';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { registeredClassIds } from './my-show-utils';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  show: IShowItem;
  entry: IShowEntry;
  entries: IShowEntry[];
};

export function MyShowEntryEditDialog({ open, onClose, show, entry, entries }: Props) {
  const { t } = useTranslate(['show', 'common']);

  const Schema = useMemo(
    () =>
      z.object({
        show_class_id: z.string().min(1, { error: t('register.validation.classRequired') }),
        notes: z.string().nullable(),
      }),
    [t]
  );
  type SchemaType = z.infer<typeof Schema>;

  const methods = useForm<SchemaType>({
    resolver: zodResolver(Schema),
    defaultValues: { show_class_id: entry.show_class_id, notes: entry.notes },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const { classes, classesLoading } = useAvailableClasses(show.id, entry.dog_id);
  const taken = registeredClassIds(entries, entry.dog_id, entry.id);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateShowEntry(show.id, entry.id, {
        show_class_id: data.show_class_id,
        notes: data.notes || null,
      });
      toast.success(t('myShows.toast.updated'));
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('myShows.toast.failed'));
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{t('myShows.editDialog.title')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label={t('myShows.editDialog.dogReadonly')}
              value={entry.dog_name}
              disabled
            />
            <Field.Select
              name="show_class_id"
              label={t('myShows.editDialog.fields.class')}
              disabled={classesLoading || classes.length === 0}
            >
              {classes.map((cls) => (
                <MenuItem key={cls.id} value={cls.id} disabled={taken.has(cls.id)}>
                  {cls.name}
                </MenuItem>
              ))}
            </Field.Select>
            <Field.Text
              name="notes"
              label={t('myShows.editDialog.fields.notes')}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={onClose}>
            {t('common:cancel', { defaultValue: 'Отмена' })}
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {t('myShows.editDialog.submit')}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
```

> Merge the two `useAvailableClasses`/`updateShowEntry` imports from `src/actions/show-entry` into a single import line to satisfy the `perfectionist` lint rule; `eslint --fix` will combine them.

- [ ] **Step 2: Create the detail view**

Create `src/sections/my-show/view/my-show-detail-view.tsx`:

```tsx
'use client';

import type { IShowEntry } from 'src/types/show-entry';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { useTranslate } from 'src/locales';
import { useGetShow } from 'src/actions/show';
import { deleteShowEntry, useMyShowEntries } from 'src/actions/show-entry';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SHOW_STATUS_COLOR, showStatusI18nKey } from 'src/sections/show/show-utils';

import { isEntryEditable } from '../my-show-utils';
import { MyShowEntryEditDialog } from '../my-show-entry-edit-dialog';

// ----------------------------------------------------------------------

type Props = { id: string };

export function MyShowDetailView({ id }: Props) {
  const { t } = useTranslate('show');
  const { show, showLoading } = useGetShow(id);
  const { entries, entriesLoading } = useMyShowEntries(id);

  const [editing, setEditing] = useState<IShowEntry | null>(null);
  const [deleting, setDeleting] = useState<IShowEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (showLoading || entriesLoading) return <LoadingScreen />;
  if (!show) {
    return (
      <DashboardContent>
        <Typography sx={{ py: 10 }}>{t('detail.notFound')}</Typography>
      </DashboardContent>
    );
  }

  const editable = isEntryEditable(show.status, show.registration_deadline);
  const dates = show.date_end
    ? `${fDate(show.date_start)} – ${fDate(show.date_end)}`
    : fDate(show.date_start);
  const location = [show.city, show.country].filter(Boolean).join(', ') || '—';

  const onConfirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deleteShowEntry(show.id, deleting.id);
      toast.success(t('myShows.toast.deleted'));
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('myShows.toast.failed'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={show.name}
        links={[
          { name: t('myShows.title'), href: paths.dashboard.myShows.root },
          { name: show.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', typography: 'body2' }}>
              <Iconify icon="solar:calendar-date-bold" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {dates}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', typography: 'body2' }}>
              <Iconify icon="mingcute:location-fill" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {location}
              </Typography>
            </Box>
          </Stack>
          <Label color={SHOW_STATUS_COLOR[show.status] ?? 'default'}>
            {t(showStatusI18nKey(show.status))}
          </Label>
        </Stack>

        {editable && (
          <Button
            component={RouterLink}
            href={paths.showcase.showRegister(show.id)}
            variant="outlined"
            startIcon={<Iconify icon="mingcute:add-line" />}
            sx={{ mt: 3 }}
          >
            {t('myShows.detail.addDog')}
          </Button>
        )}
      </Card>

      {!editable && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {t('myShows.detail.locked')}
        </Typography>
      )}

      {entries.length === 0 ? (
        <EmptyContent filled title={t('myShows.detail.empty')} sx={{ py: 8 }} />
      ) : (
        <Card>
          <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
            {entries.map((entry) => (
              <Stack
                key={entry.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ p: 2.5 }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">
                    {entry.dog_name}
                    {entry.catalog_number != null ? ` — №${entry.catalog_number}` : ''}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {entry.class_name}
                    {entry.notes ? ` · ${entry.notes}` : ''}
                  </Typography>
                </Stack>
                {editable && (
                  <Stack direction="row" spacing={1}>
                    <IconButton onClick={() => setEditing(entry)}>
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton color="error" onClick={() => setDeleting(entry)}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Stack>
                )}
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      {editing && (
        <MyShowEntryEditDialog
          open={!!editing}
          onClose={() => setEditing(null)}
          show={show}
          entry={editing}
          entries={entries}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('myShows.delete.title')}
        content={t('myShows.delete.message')}
        action={
          <Button variant="contained" color="error" loading={isDeleting} onClick={onConfirmDelete}>
            {t('myShows.delete.confirm')}
          </Button>
        }
      />
    </DashboardContent>
  );
}
```

> Confirm import sources by copying from existing code: `ConfirmDialog` from `src/components/custom-dialog` (used in dog/kennel sections), `RouterLink` from `src/routes/components`. Verify icons `solar:pen-bold`, `solar:trash-bin-trash-bold`, `mingcute:add-line` are registered in `icon-sets.ts` (all common in the template); if any is missing, register it or swap for a registered equivalent.

- [ ] **Step 3: Verify**

Run: `npx eslint --fix src/sections/my-show/my-show-entry-edit-dialog.tsx src/sections/my-show/view/my-show-detail-view.tsx && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/sections/my-show/my-show-entry-edit-dialog.tsx src/sections/my-show/view/my-show-detail-view.tsx
git commit -m "feat(my-shows): detail view + entry edit dialog + delete confirm"
```

---

## Task 8: App Router pages (RBAC-guarded)

**Files:**
- Create: `src/app/dashboard/my-shows/page.tsx`
- Create: `src/app/dashboard/my-shows/[id]/page.tsx`

- [ ] **Step 1: List page**

Create `src/app/dashboard/my-shows/page.tsx` (pattern from `src/app/dashboard/dogs/page.tsx`):

```tsx
import { CONFIG } from 'src/global-config';

import { PermissionGuard } from 'src/auth/guard';

import { MyShowsListView } from 'src/sections/my-show/view';

// ----------------------------------------------------------------------

export const metadata = { title: `My Shows | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="dogs:view">
      <MyShowsListView />
    </PermissionGuard>
  );
}
```

- [ ] **Step 2: Detail page (Next 16 async params)**

Create `src/app/dashboard/my-shows/[id]/page.tsx`:

```tsx
import { CONFIG } from 'src/global-config';

import { PermissionGuard } from 'src/auth/guard';

import { MyShowDetailView } from 'src/sections/my-show/view';

// ----------------------------------------------------------------------

export const metadata = { title: `My Show | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="dogs:view">
      <MyShowDetailView id={id} />
    </PermissionGuard>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/my-shows
git commit -m "feat(my-shows): RBAC-guarded App Router pages (list + detail)"
```

---

## Task 9: Navigation links (drawer + left menu)

**Files:**
- Modify: `src/layouts/nav-config-account.tsx`
- Modify: `src/layouts/nav-config-dashboard.tsx`

- [ ] **Step 1: AccountDrawer link**

In `src/layouts/nav-config-account.tsx`, add the "My Shows" item to the base list returned by `getAccountNavData`, gated by `can('dogs:view')`. Replace the `return [...base, ...myObjects];` tail with:

```tsx
  const myShows: AccountNavData = can('dogs:view')
    ? [
        {
          label: t('drawer.myShows'),
          href: paths.dashboard.myShows.root,
          icon: <Iconify icon="solar:cup-star-bold-duotone" />,
        },
      ]
    : [];

  return [...base, ...myShows, ...myObjects];
```

- [ ] **Step 2: Left dashboard menu link**

In `src/layouts/nav-config-dashboard.tsx`, add an item inside the ShowTail `items` array, right before the `profile` item (~line 193):

```tsx
        {
          title: t('showtail.myShows'),
          path: paths.dashboard.myShows.root,
          icon: ICONS.booking,
          permission: 'dogs:view',
        },
```

- [ ] **Step 3: Verify**

Run: `npx eslint --fix src/layouts/nav-config-account.tsx src/layouts/nav-config-dashboard.tsx && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/nav-config-account.tsx src/layouts/nav-config-dashboard.tsx
git commit -m "feat(my-shows): nav links in account drawer + dashboard menu (dogs:view)"
```

---

## Task 10: i18n (RU + EN)

**Files:**
- Modify: `src/locales/langs/ru/show.json`, `src/locales/langs/en/show.json`
- Modify: `src/locales/langs/ru/account.json`, `src/locales/langs/en/account.json`
- Modify: `src/locales/langs/ru/navbar.json`, `src/locales/langs/en/navbar.json`

- [ ] **Step 1: show.json — add `myShows` block**

Add to `src/locales/langs/ru/show.json` (top-level key, valid JSON — mind commas):

```json
  "myShows": {
    "title": "Мои выставки",
    "breadcrumb": "Мои выставки",
    "tabs": { "all": "Все", "active": "Активные", "past": "Прошедшие" },
    "card": { "entriesCount_one": "{{count}} запись", "entriesCount_few": "{{count}} записи", "entriesCount_many": "{{count}} записей" },
    "detail": {
      "addDog": "Записать ещё собаку",
      "locked": "Регистрация закрыта — изменение записей недоступно.",
      "empty": "На этой выставке у вас пока нет записей."
    },
    "editDialog": {
      "title": "Изменить запись",
      "dogReadonly": "Собака",
      "fields": { "class": "Класс", "notes": "Заметки" },
      "submit": "Сохранить"
    },
    "delete": {
      "title": "Удалить запись?",
      "message": "Запись собаки на выставку будет удалена. Это действие необратимо.",
      "confirm": "Удалить"
    },
    "toast": { "updated": "Запись обновлена", "deleted": "Запись удалена", "failed": "Не удалось выполнить действие" },
    "empty": { "title": "Нет выставок", "description": "Здесь появятся выставки, на которые вы записали своих собак." }
  }
```

And `src/locales/langs/en/show.json`:

```json
  "myShows": {
    "title": "My shows",
    "breadcrumb": "My shows",
    "tabs": { "all": "All", "active": "Active", "past": "Past" },
    "card": { "entriesCount_one": "{{count}} entry", "entriesCount_other": "{{count}} entries" },
    "detail": {
      "addDog": "Register another dog",
      "locked": "Registration is closed — editing entries is unavailable.",
      "empty": "You have no entries for this show yet."
    },
    "editDialog": {
      "title": "Edit entry",
      "dogReadonly": "Dog",
      "fields": { "class": "Class", "notes": "Notes" },
      "submit": "Save"
    },
    "delete": {
      "title": "Delete entry?",
      "message": "This show entry will be deleted. This action cannot be undone.",
      "confirm": "Delete"
    },
    "toast": { "updated": "Entry updated", "deleted": "Entry deleted", "failed": "Action failed" },
    "empty": { "title": "No shows", "description": "Shows you have registered your dogs for will appear here." }
  }
```

> i18next plural keys: Russian uses `_one/_few/_many`, English `_one/_other`. The call `t('myShows.card.entriesCount', { count })` resolves the right plural automatically. Verify the i18n init has the plural backend (standard in this template).

- [ ] **Step 2: account.json — add `drawer.myShows`**

In `src/locales/langs/ru/account.json` `drawer`: add `"myShows": "Мои выставки"`.
In `src/locales/langs/en/account.json` `drawer`: add `"myShows": "My shows"`.

- [ ] **Step 3: navbar.json — add `showtail.myShows`**

In `src/locales/langs/ru/navbar.json` `showtail`: add `"myShows": "Мои выставки"`.
In `src/locales/langs/en/navbar.json` `showtail`: add `"myShows": "My shows"`.

- [ ] **Step 4: Verify JSON validity**

Run: `node -e "['ru','en'].forEach(l=>['show','account','navbar'].forEach(f=>JSON.parse(require('fs').readFileSync('src/locales/langs/'+l+'/'+f+'.json','utf8'))));console.log('json ok')"`
Expected: `json ok`.

- [ ] **Step 5: Commit**

```bash
git add src/locales/langs
git commit -m "feat(my-shows): i18n RU+EN (show.myShows, drawer, navbar)"
```

---

## Task 11: Final gates

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 errors. (If import-order issues: `npx eslint --fix src/sections/my-show src/actions/my-show.ts src/layouts/nav-config-account.tsx src/layouts/nav-config-dashboard.tsx`.)

- [ ] **Step 3: Tests**

Run: `npm test`
Expected: green, including `my-show-utils`.

- [ ] **Step 4: Runtime smoke (only if `:8000/health/` is 200)**

- Log in as a breeder/buyer with at least one dog and an entry.
- Open `/dashboard/my-shows`: tabs switch (all/active/past), cards render with «N записей», pagination works.
- Click a card → `/dashboard/my-shows/[id]`: my entries listed with names/classes.
- On an active (registration_open) show: edit an entry (class/notes) → toast + list updates; delete → confirm → removed; if last entry removed, the show drops from the grid after revalidate.
- Confirm an organizer/judge account does NOT see the link or the page (RBAC).

- [ ] **Step 5: Final commit (if any fixes)**

```bash
git add -A
git commit -m "chore(my-shows): satisfy tsc/lint/test gates"
```

---

## Self-Review Checklist (verified against spec)

- [ ] Drawer link + left-menu link, both gated `dogs:view`; pages wrapped in `PermissionGuard`. (Spec §Decisions.5, §Навигация)
- [ ] Tabs all/active/past drive `status_group`; tab change resets to page 1. (Spec §3 Список)
- [ ] Clickable cards in a responsive grid → detail route; pagination present. (Spec §3, §Цель)
- [ ] Detail = show header + my entries (dog/class/catalog/notes); edit (dialog, class+notes) + delete (ConfirmDialog) shown only while `canRegisterForShow`; «add dog» → `showcase.showRegister`. (Spec §3 Детали, §Decisions.4)
- [ ] Dog not editable in the entry (read-only field); duplicate class guarded via `registeredClassIds`. (Spec §Decisions.6, §3 Редактирование)
- [ ] i18n RU+EN for all new strings; RU default. (Spec §i18n)
- [ ] tsc/lint/test gates green. (Spec §Проверки)

## Notes / deferred (YAGNI per spec)

- Handler editing omitted in the dialog v1 (class + notes only) — user-approved.
- No bulk operations, no extra filters beyond the three tabs, organizer show CRUD untouched.
