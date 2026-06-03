# Public Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public, login-free showcase (Kennels, Animals/classifieds, Shows) of card grids + detail pages on `MainLayout`, plus a tour-style public dog detail page, leaving the private `/dashboard/*` tables untouched.

**Architecture:** New top-level App Router routes (`/kennels`, `/animals`, `/shows`, `/dogs/[id]`) each wrapped by a thin `layout.tsx` → `MainLayout` (header/footer, like `/post`). Each domain gets read-only showcase view + card + grid + detail view under `src/sections/<domain>`. Lists use existing SWR hooks with server pagination and server `sort_by`/`order` (see Addendum); only the classifieds `active` filter and the shows "upcoming" bucket remain client-side. Pure logic (price/format/show-bucket/primary-image/placeholder) lives in tested `*-utils.ts` files.

**Tech Stack:** Next.js 16 App Router, MUI 7, TypeScript, SWR, vitest. Reuse template primitives: `Image`, `Iconify`, `Label`, `Lightbox`, `Markdown`, `EmptyContent`, `ProfileCover`, `Scrollbar`, `TableHeadCustom`, plus the `tour` section pattern.

**Quality gates (run before every commit):** `npx tsc --noEmit` → 0, `npx eslint --fix <changed files>` then `npm run lint` → 0, `npm test` → green. Iconify names must exist in `src/components/iconify/icon-sets.ts` (add if missing).

**Phasing:** Phase 0 (foundation) → Phase 1 (Kennels + Dog detail) → Phase 2 (Animals) → Phase 3 (Shows). Each phase is independently shippable.

> **⚠️ READ THE ADDENDUM FIRST.** The backend shipped the requested contract changes on 2026-06-03 (dog photos, kennel `is_verified`/counts, litter `father`/`mother` objects, server `sort_by`/`order`). The **Addendum** at the bottom of this file overrides specific code in Tasks 1.2, 1.3, 1.4, 1.5, 1.6, 2.2, 3.2. Where the addendum and a task body disagree, the addendum wins. Types/actions were already updated to the new contract (committed separately) — do NOT re-edit `src/types/*` or `src/actions/*` for these fields.

---

## Phase 0 — Foundation

### Task 0.1: Showcase paths

**Files:**
- Modify: `src/routes/paths.ts` (inside the top-level `paths = { ... }` object, after `post: {...}` block near line 46)

- [ ] **Step 1: Add showcase paths**

Insert this block right after the `post: { ... }` object (around line 46), before `// AUTH`:

```ts
  showcase: {
    kennels: `/kennels`,
    kennel: (id: string) => `/kennels/${id}`,
    animals: `/animals`,
    classified: (id: string) => `/animals/${id}`,
    shows: `/shows`,
    show: (id: string) => `/shows/${id}`,
    dog: (id: string) => `/dogs/${id}`,
  },
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/paths.ts
git commit -m "feat(showcase): add public showcase route paths"
```

---

### Task 0.2: Dog placeholder util (TDD)

**Files:**
- Create: `src/sections/dog/dog-utils.ts`
- Test: `src/sections/dog/__tests__/dog-utils.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';

import { dogPlaceholderImage } from '../dog-utils';

describe('dogPlaceholderImage', () => {
  it('returns the female cover for female', () => {
    expect(dogPlaceholderImage('female')).toContain('cover-7');
  });
  it('returns the male cover for male', () => {
    expect(dogPlaceholderImage('male')).toContain('cover-12');
  });
  it('falls back to male cover for null/undefined', () => {
    expect(dogPlaceholderImage(null)).toContain('cover-12');
    expect(dogPlaceholderImage(undefined)).toContain('cover-12');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sections/dog/__tests__/dog-utils.test.ts`
Expected: FAIL — cannot find module `../dog-utils`.

- [ ] **Step 3: Implement**

```ts
import type { DogSex } from 'src/types/dog';

import { CONFIG } from 'src/global-config';

// Dogs have no photos in the backend — use a deterministic placeholder cover by sex.
const DOG_PLACEHOLDERS: Record<DogSex, string> = {
  male: `${CONFIG.assetsDir}/assets/images/mock/cover/cover-12.webp`,
  female: `${CONFIG.assetsDir}/assets/images/mock/cover/cover-7.webp`,
};

export function dogPlaceholderImage(sex?: DogSex | null): string {
  if (sex && sex in DOG_PLACEHOLDERS) {
    return DOG_PLACEHOLDERS[sex];
  }
  return DOG_PLACEHOLDERS.male;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sections/dog/__tests__/dog-utils.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/sections/dog/dog-utils.ts src/sections/dog/__tests__/dog-utils.test.ts
git commit -m "feat(dog): placeholder image helper by sex"
```

---

### Task 0.3: Classified utils (TDD)

**Files:**
- Create: `src/sections/classified/classified-utils.ts`
- Test: `src/sections/classified/__tests__/classified-utils.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';

import { primaryImageFileId, formatClassifiedPrice } from '../classified-utils';

describe('formatClassifiedPrice', () => {
  it('labels free', () => {
    expect(formatClassifiedPrice(0, 'free')).toBe('Бесплатно');
  });
  it('labels negotiable', () => {
    expect(formatClassifiedPrice(null, 'negotiable')).toBe('Договорная');
  });
  it('formats a fixed price with digits', () => {
    expect(formatClassifiedPrice(1500, 'fixed')).toMatch(/1.?500/);
  });
  it('returns dash for fixed without price', () => {
    expect(formatClassifiedPrice(null, 'fixed')).toBe('—');
  });
});

describe('primaryImageFileId', () => {
  it('prefers the primary image', () => {
    expect(
      primaryImageFileId([
        { file_id: 'a', is_primary: false },
        { file_id: 'b', is_primary: true },
      ])
    ).toBe('b');
  });
  it('falls back to the first image', () => {
    expect(primaryImageFileId([{ file_id: 'a' }, { file_id: 'b' }])).toBe('a');
  });
  it('returns undefined for empty', () => {
    expect(primaryImageFileId([])).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sections/classified/__tests__/classified-utils.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement**

```ts
import type { IClassifiedImage, ClassifiedPriceKind } from 'src/types/classified';

import { fCurrency } from 'src/utils/format-number';

export function formatClassifiedPrice(
  price: number | null,
  kind: ClassifiedPriceKind
): string {
  if (kind === 'free') return 'Бесплатно';
  if (kind === 'negotiable') return 'Договорная';
  return price != null ? fCurrency(price) : '—';
}

export function primaryImageFileId(images: IClassifiedImage[]): string | undefined {
  if (!images?.length) return undefined;
  const primary = images.find((img) => img.is_primary);
  return (primary ?? images[0]).file_id;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sections/classified/__tests__/classified-utils.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/sections/classified/classified-utils.ts src/sections/classified/__tests__/classified-utils.test.ts
git commit -m "feat(classified): price + primary-image helpers"
```

---

### Task 0.4: Show bucket utils (TDD)

**Files:**
- Create: `src/sections/show/show-utils.ts`
- Test: `src/sections/show/__tests__/show-utils.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';

import { classifyShow, SHOW_PAST_STATUSES, SHOW_UPCOMING_STATUSES } from '../show-utils';

describe('classifyShow', () => {
  it('buckets registration/in-progress as upcoming', () => {
    SHOW_UPCOMING_STATUSES.forEach((s) => expect(classifyShow(s)).toBe('upcoming'));
  });
  it('buckets completed as past', () => {
    SHOW_PAST_STATUSES.forEach((s) => expect(classifyShow(s)).toBe('past'));
  });
  it('returns null for draft/cancelled (not shown publicly)', () => {
    expect(classifyShow('draft')).toBeNull();
    expect(classifyShow('cancelled')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sections/show/__tests__/show-utils.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement**

```ts
import type { ShowStatus } from 'src/types/show';

export const SHOW_UPCOMING_STATUSES: ShowStatus[] = [
  'registration_open',
  'registration_closed',
  'in_progress',
];

export const SHOW_PAST_STATUSES: ShowStatus[] = ['completed'];

export type ShowBucket = 'upcoming' | 'past';

export function classifyShow(status: ShowStatus): ShowBucket | null {
  if (SHOW_UPCOMING_STATUSES.includes(status)) return 'upcoming';
  if (SHOW_PAST_STATUSES.includes(status)) return 'past';
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sections/show/__tests__/show-utils.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/sections/show/show-utils.ts src/sections/show/__tests__/show-utils.test.ts
git commit -m "feat(show): upcoming/past bucket helper"
```

---

### Task 0.5: Public nav entries

**Files:**
- Modify: `src/layouts/nav-config-main.tsx` (the `navData` array, top, after the `Home` item near line 12)

- [ ] **Step 1: Add showcase nav items**

After the `Home` entry and before `Components`, insert:

```tsx
  {
    title: 'Питомники',
    path: paths.showcase.kennels,
    icon: <Iconify width={22} icon="solar:home-2-bold-duotone" />,
  },
  {
    title: 'Животные',
    path: paths.showcase.animals,
    icon: <Iconify width={22} icon="solar:bone-bold-duotone" />,
  },
  {
    title: 'Выставки',
    path: paths.showcase.shows,
    icon: <Iconify width={22} icon="solar:cup-star-bold-duotone" />,
  },
```

- [ ] **Step 2: Verify icons are registered**

Run: `npx tsc --noEmit`
Expected: 0 errors. If an icon name errors, open `src/components/iconify/icon-sets.ts` and add the missing `solar:...` name to the registry, then re-run. (Replace with an already-registered `solar:*` duotone icon if a chosen one is unavailable in the icon pack.)

- [ ] **Step 3: Lint + commit**

```bash
npx eslint --fix src/layouts/nav-config-main.tsx && npm run lint
git add src/layouts/nav-config-main.tsx src/components/iconify/icon-sets.ts
git commit -m "feat(showcase): public nav entries (kennels/animals/shows)"
```

---

### Task 0.6: Shared showcase shell component

A small wrapper giving public pages a `Container` with header-clearing spacing and a title. Reused by all showcase list/detail pages.

**Files:**
- Create: `src/sections/showcase/showcase-shell.tsx`
- Create: `src/sections/showcase/index.ts`

- [ ] **Step 1: Implement the shell**

`src/sections/showcase/showcase-shell.tsx`:

```tsx
import type { ReactNode } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type Props = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function ShowcaseShell({ title, action, children }: Props) {
  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      {(title || action) && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: { xs: 3, md: 5 } }}
        >
          {title && <Typography variant="h3">{title}</Typography>}
          {action}
        </Stack>
      )}
      {children}
    </Container>
  );
}
```

`src/sections/showcase/index.ts`:

```ts
export * from './showcase-shell';
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/showcase/*.tsx src/sections/showcase/*.ts && npm run lint
git add src/sections/showcase
git commit -m "feat(showcase): shared public page shell"
```

---

## Phase 1 — Kennels + Dog detail

### Task 1.1: Extract reusable PedigreeTree

Move the inline `PedigreeTree` from `dog-detail-view.tsx` into a shared component so both the private and public dog views use it.

**Files:**
- Create: `src/sections/dog/pedigree-tree.tsx`
- Modify: `src/sections/dog/view/dog-detail-view.tsx` (remove inline `PedigreeTree`, import the shared one)

- [ ] **Step 1: Create the shared component**

`src/sections/dog/pedigree-tree.tsx` (verbatim copy of the existing inline component, lines 28-61 of `dog-detail-view.tsx`):

```tsx
import type { IPedigreeNode } from 'src/types/dog';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function PedigreeTree({ node, label }: { node: IPedigreeNode | null; label?: string }) {
  if (!node) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
        {label}: —
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="body2">
        {label ? `${label}: ` : ''}
        <strong>{node.name}</strong>
        {node.rkf_number ? ` · ${node.rkf_number}` : ''}
      </Typography>

      {(node.father || node.mother) && (
        <Stack
          spacing={0.75}
          sx={{
            mt: 0.75,
            ml: 1.5,
            pl: 1.5,
            borderLeft: (theme) => `2px solid ${theme.vars.palette.divider}`,
          }}
        >
          <PedigreeTree node={node.father} label="Sire" />
          <PedigreeTree node={node.mother} label="Dam" />
        </Stack>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Update the private detail view to import it**

In `src/sections/dog/view/dog-detail-view.tsx`: delete the inline `function PedigreeTree(...) {...}` block (and its `IPedigreeNode` type import if now unused there) and add at the imports:

```tsx
import { PedigreeTree } from '../pedigree-tree';
```

Leave the two `<PedigreeTree ... />` usages unchanged.

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/dog/pedigree-tree.tsx src/sections/dog/view/dog-detail-view.tsx && npm run lint
npm test
git add src/sections/dog/pedigree-tree.tsx src/sections/dog/view/dog-detail-view.tsx
git commit -m "refactor(dog): extract reusable PedigreeTree"
```

---

### Task 1.2: Dog card + grid

**Files:**
- Create: `src/sections/dog/dog-card.tsx`
- Create: `src/sections/dog/dog-card-grid.tsx`

- [ ] **Step 1: Implement the card**

`src/sections/dog/dog-card.tsx`:

```tsx
import type { CardProps } from '@mui/material/Card';
import type { IDogItem } from 'src/types/dog';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';

import { dogPlaceholderImage } from './dog-utils';

// ----------------------------------------------------------------------

type Props = CardProps & {
  dog: IDogItem;
  breedName?: string;
};

export function DogCard({ dog, breedName, sx, ...other }: Props) {
  const detailsHref = paths.showcase.dog(dog.id);

  const info = [
    {
      icon: <Iconify icon="solar:dna-bold" sx={{ color: 'info.main' }} />,
      label: breedName ?? '—',
    },
    {
      icon: <Iconify icon="solar:men-bold" sx={{ color: 'primary.main' }} />,
      label: dog.sex === 'female' ? 'Сука' : 'Кобель',
    },
    {
      icon: <Iconify icon="solar:calendar-date-bold" sx={{ color: 'warning.main' }} />,
      label: dog.date_of_birth ? fDate(dog.date_of_birth) : '—',
    },
  ];

  return (
    <Card sx={sx} {...other}>
      <Box sx={{ p: 1 }}>
        <Image
          alt={dog.name}
          src={dogPlaceholderImage(dog.sex)}
          ratio="4/3"
          sx={{ borderRadius: 1.5 }}
        />
      </Box>

      <ListItemText
        sx={{ p: (theme) => theme.spacing(1, 2.5, 0, 2.5) }}
        primary={
          <Link component={RouterLink} href={detailsHref} color="inherit">
            {dog.name}
          </Link>
        }
        secondary={dog.rkf_number ? `RKF: ${dog.rkf_number}` : ' '}
        slotProps={{
          primary: { noWrap: true, sx: { typography: 'subtitle1' } },
          secondary: { sx: { mt: 0.5, typography: 'caption', color: 'text.disabled' } },
        }}
      />

      <Box
        sx={{
          p: 2.5,
          gap: 1,
          display: 'flex',
          flexWrap: 'wrap',
          typography: 'body2',
        }}
      >
        {info.map((item) => (
          <Box
            key={item.label}
            sx={{ gap: 0.5, display: 'flex', alignItems: 'center', mr: 1.5 }}
          >
            {item.icon}
            {item.label}
          </Box>
        ))}
      </Box>
    </Card>
  );
}
```

- [ ] **Step 2: Implement the grid**

`src/sections/dog/dog-card-grid.tsx`:

```tsx
import type { IDogItem } from 'src/types/dog';

import Box from '@mui/material/Box';

import { DogCard } from './dog-card';

// ----------------------------------------------------------------------

type Props = {
  dogs: IDogItem[];
  breedNameById?: Record<string, string>;
};

export function DogCardGrid({ dogs, breedNameById }: Props) {
  return (
    <Box
      sx={{
        gap: 3,
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
      }}
    >
      {dogs.map((dog) => (
        <DogCard key={dog.id} dog={dog} breedName={breedNameById?.[dog.breed_id]} />
      ))}
    </Box>
  );
}
```

- [ ] **Step 3: Verify icons + compile**

Run: `npx tsc --noEmit`
Expected: 0 errors. If `solar:dna-bold`/`solar:men-bold` are unregistered, add them to `src/components/iconify/icon-sets.ts` or swap for registered equivalents (e.g. `solar:paw-print-bold`, `mingcute:male-line`).

- [ ] **Step 4: Lint + commit**

```bash
npx eslint --fix src/sections/dog/dog-card.tsx src/sections/dog/dog-card-grid.tsx && npm run lint
git add src/sections/dog/dog-card.tsx src/sections/dog/dog-card-grid.tsx src/components/iconify/icon-sets.ts
git commit -m "feat(dog): showcase card + grid"
```

---

### Task 1.3: Public dog detail view + route

**Files:**
- Create: `src/sections/dog/view/dog-public-detail-view.tsx`
- Modify: `src/sections/dog/view/index.ts` (add export)
- Create: `src/app/dogs/layout.tsx`
- Create: `src/app/dogs/[id]/page.tsx`

- [ ] **Step 1: Implement the public detail view**

`src/sections/dog/view/dog-public-detail-view.tsx`:

```tsx
'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { useGetBreeds } from 'src/actions/reference';
import { useGetDog, useGetDogTitles, useGetDogPedigree } from 'src/actions/dog';

import { Image } from 'src/components/image';
import { Markdown } from 'src/components/markdown';
import { LoadingScreen } from 'src/components/loading-screen';

import { dogPlaceholderImage } from '../dog-utils';
import { PedigreeTree } from '../pedigree-tree';

// ----------------------------------------------------------------------

type Props = { id: string };

export function DogPublicDetailView({ id }: Props) {
  const { dog, dogLoading } = useGetDog(id);
  const { titles } = useGetDogTitles(id);
  const { pedigree } = useGetDogPedigree(id);
  const { breeds } = useGetBreeds();

  if (dogLoading) return <LoadingScreen />;
  if (!dog) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>Собака не найдена.</Typography>
      </Container>
    );
  }

  const breedName = breeds.find((b) => b.id === dog.breed_id)?.name ?? '—';

  const overview = [
    { label: 'Порода', value: breedName },
    { label: 'Пол', value: dog.sex === 'female' ? 'Сука' : 'Кобель' },
    { label: 'Дата рождения', value: dog.date_of_birth ? fDate(dog.date_of_birth) : '—' },
    { label: 'Окрас', value: dog.color ?? '—' },
    { label: 'RKF №', value: dog.rkf_number ?? '—' },
    { label: 'Микрочип', value: dog.microchip ?? '—' },
  ];

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Image
        alt={dog.name}
        src={dogPlaceholderImage(dog.sex)}
        ratio="16/9"
        sx={{ borderRadius: 2, mb: { xs: 3, md: 5 } }}
      />

      <Box sx={{ mx: 'auto', maxWidth: 720 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {dog.name}
          </Typography>
          <Chip size="small" label={breedName} />
          <Chip size="small" color="info" label={dog.sex === 'female' ? 'Сука' : 'Кобель'} />
        </Stack>

        {dog.kennel_id && (
          <Link component={RouterLink} href={paths.showcase.kennel(dog.kennel_id)} variant="body2">
            Питомник
          </Link>
        )}

        <Divider sx={{ borderStyle: 'dashed', my: 4 }} />

        <Box
          sx={{
            gap: 3,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          {overview.map((item) => (
            <ListItemText
              key={item.label}
              primary={item.label}
              secondary={item.value}
              slotProps={{
                primary: { sx: { typography: 'body2', color: 'text.secondary' } },
                secondary: { sx: { mt: 0.5, typography: 'subtitle2', color: 'text.primary' } },
              }}
            />
          ))}
        </Box>

        <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
          {dog.father_id && (
            <Link component={RouterLink} href={paths.showcase.dog(dog.father_id)} variant="body2">
              Отец
            </Link>
          )}
          {dog.mother_id && (
            <Link component={RouterLink} href={paths.showcase.dog(dog.mother_id)} variant="body2">
              Мать
            </Link>
          )}
        </Stack>

        {dog.description && (
          <>
            <Divider sx={{ borderStyle: 'dashed', my: 4 }} />
            <Markdown children={dog.description} />
          </>
        )}

        <Divider sx={{ borderStyle: 'dashed', my: 4 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Титулы ({titles.length})
        </Typography>
        {titles.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Титулов пока нет.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {titles.map((t) => (
              <Typography key={t.id} variant="body2">
                {t.title_id} — {fDate(t.date_earned)}
              </Typography>
            ))}
          </Stack>
        )}

        <Divider sx={{ borderStyle: 'dashed', my: 4 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Родословная
        </Typography>
        <Card sx={{ p: 3 }}>
          {pedigree ? (
            <PedigreeTree node={pedigree} />
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Нет данных о родословной.
            </Typography>
          )}
        </Card>
      </Box>
    </Container>
  );
}
```

- [ ] **Step 2: Export it**

In `src/sections/dog/view/index.ts` add:

```ts
export * from './dog-public-detail-view';
```

- [ ] **Step 3: Create the route layout + page**

`src/app/dogs/layout.tsx`:

```tsx
import { MainLayout } from 'src/layouts/main';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
```

`src/app/dogs/[id]/page.tsx`:

```tsx
import { CONFIG } from 'src/global-config';

import { DogPublicDetailView } from 'src/sections/dog/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Собака - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <DogPublicDetailView id={id} />;
}
```

- [ ] **Step 4: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/dog/view/dog-public-detail-view.tsx src/sections/dog/view/index.ts src/app/dogs/layout.tsx "src/app/dogs/[id]/page.tsx" && npm run lint
git add src/sections/dog/view src/app/dogs
git commit -m "feat(dog): public tour-style detail page at /dogs/[id]"
```

---

### Task 1.4: Kennel card + grid

**Files:**
- Create: `src/sections/kennel/kennel-card.tsx`
- Create: `src/sections/kennel/kennel-card-grid.tsx`

- [ ] **Step 1: Implement the card**

`src/sections/kennel/kennel-card.tsx`:

```tsx
import type { CardProps } from '@mui/material/Card';
import type { IKennelItem } from 'src/types/kennel';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { fileUrl } from 'src/actions/file';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const KENNEL_PLACEHOLDER = `${CONFIG.assetsDir}/assets/images/mock/cover/cover-4.webp`;

type Props = CardProps & {
  kennel: IKennelItem;
};

export function KennelCard({ kennel, sx, ...other }: Props) {
  const detailsHref = paths.showcase.kennel(kennel.id);
  const location = [kennel.city, kennel.country].filter(Boolean).join(', ') || '—';

  return (
    <Card sx={sx} {...other}>
      <Box sx={{ p: 1 }}>
        <Image
          alt={kennel.name}
          src={fileUrl(kennel.avatar_file_id) || KENNEL_PLACEHOLDER}
          ratio="4/3"
          sx={{ borderRadius: 1.5 }}
        />
      </Box>

      <ListItemText
        sx={{ p: (theme) => theme.spacing(1, 2.5, 0, 2.5) }}
        primary={
          <Link component={RouterLink} href={detailsHref} color="inherit">
            {kennel.name}
          </Link>
        }
        secondary={kennel.kennel_prefix ? `Префикс: ${kennel.kennel_prefix}` : ' '}
        slotProps={{
          primary: { noWrap: true, sx: { typography: 'subtitle1' } },
          secondary: { sx: { mt: 0.5, typography: 'caption', color: 'text.disabled' } },
        }}
      />

      <Box
        sx={{
          p: 2.5,
          gap: 0.5,
          display: 'flex',
          alignItems: 'center',
          typography: 'body2',
        }}
      >
        <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />
        {location}
      </Box>
    </Card>
  );
}
```

- [ ] **Step 2: Implement the grid**

`src/sections/kennel/kennel-card-grid.tsx`:

```tsx
import type { IKennelItem } from 'src/types/kennel';

import Box from '@mui/material/Box';

import { KennelCard } from './kennel-card';

// ----------------------------------------------------------------------

type Props = { kennels: IKennelItem[] };

export function KennelCardGrid({ kennels }: Props) {
  return (
    <Box
      sx={{
        gap: 3,
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
      }}
    >
      {kennels.map((kennel) => (
        <KennelCard key={kennel.id} kennel={kennel} />
      ))}
    </Box>
  );
}
```

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/kennel/kennel-card.tsx src/sections/kennel/kennel-card-grid.tsx && npm run lint
git add src/sections/kennel/kennel-card.tsx src/sections/kennel/kennel-card-grid.tsx
git commit -m "feat(kennel): showcase card + grid"
```

---

### Task 1.5: Kennel showcase list view + route

**Files:**
- Create: `src/sections/kennel/view/kennel-showcase-view.tsx`
- Modify: `src/sections/kennel/view/index.ts`
- Create: `src/app/kennels/layout.tsx`
- Create: `src/app/kennels/page.tsx`

- [ ] **Step 1: Implement the showcase view**

`src/sections/kennel/view/kennel-showcase-view.tsx`:

```tsx
'use client';

import type { IKennelTableFilters } from 'src/types/kennel';

import { useSetState } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import { useState, useCallback } from 'react';

import { useGetKennelsList } from 'src/actions/kennel';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { ShowcaseShell } from 'src/sections/showcase';

import { KennelCardGrid } from '../kennel-card-grid';

// ----------------------------------------------------------------------

export function KennelShowcaseView() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const filters = useSetState<IKennelTableFilters>({ search: '', city: '' });
  const { state: currentFilters, setState } = filters;

  const { kennels, kennelsTotal, kennelsLoading, kennelsEmpty } = useGetKennelsList({
    page: page + 1,
    per_page: rowsPerPage,
    search: currentFilters.search || undefined,
    city: currentFilters.city || undefined,
  });

  const handleSearch = useCallback(
    (value: string) => {
      setPage(0);
      setState({ search: value });
    },
    [setState]
  );

  return (
    <ShowcaseShell title="Питомники">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <TextField
          fullWidth
          value={currentFilters.search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Поиск по названию..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          value={currentFilters.city}
          onChange={(e) => {
            setPage(0);
            setState({ city: e.target.value });
          }}
          placeholder="Город"
          sx={{ width: { xs: 1, sm: 240 } }}
        />
      </Stack>

      {kennelsLoading ? (
        <LoadingScreen />
      ) : kennelsEmpty ? (
        <EmptyContent filled title="Питомники не найдены" sx={{ py: 10 }} />
      ) : (
        <>
          <KennelCardGrid kennels={kennels} />
          <TablePagination
            component="div"
            page={page}
            count={kennelsTotal}
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
    </ShowcaseShell>
  );
}
```

- [ ] **Step 2: Export + route**

In `src/sections/kennel/view/index.ts` add:

```ts
export * from './kennel-showcase-view';
export * from './kennel-detail-view';
```

(Both exports added now; `kennel-detail-view` is created in Task 1.7. If executing strictly task-by-task, add only `kennel-showcase-view` here and add `kennel-detail-view` in Task 1.7.)

`src/app/kennels/layout.tsx`:

```tsx
import { MainLayout } from 'src/layouts/main';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
```

`src/app/kennels/page.tsx`:

```tsx
import { CONFIG } from 'src/global-config';

import { KennelShowcaseView } from 'src/sections/kennel/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Питомники - ${CONFIG.appName}` };

export default function Page() {
  return <KennelShowcaseView />;
}
```

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/kennel/view/kennel-showcase-view.tsx src/sections/kennel/view/index.ts src/app/kennels/layout.tsx src/app/kennels/page.tsx && npm run lint
git add src/sections/kennel/view/kennel-showcase-view.tsx src/sections/kennel/view/index.ts src/app/kennels
git commit -m "feat(kennel): public showcase grid at /kennels"
```

---

### Task 1.6: Kennel litter card

**Files:**
- Create: `src/sections/kennel/kennel-litter-card.tsx`

- [ ] **Step 1: Implement**

`src/sections/kennel/kennel-litter-card.tsx`:

```tsx
import type { ILitterItem } from 'src/types/litter';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

const STATUS_LABEL: Record<string, string> = {
  planned: 'Планируется',
  born: 'Родился',
  available: 'Доступен',
  sold_out: 'Распродан',
  archived: 'Архив',
};

type Props = {
  litter: ILitterItem;
  breedName?: string;
};

export function KennelLitterCard({ litter, breedName }: Props) {
  const price =
    litter.price_from != null || litter.price_to != null
      ? [litter.price_from, litter.price_to]
          .filter((v) => v != null)
          .map((v) => fCurrency(v as number))
          .join(' – ')
      : '—';

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1">{breedName ?? 'Помёт'}</Typography>
        <Label color="info">{STATUS_LABEL[litter.status] ?? litter.status}</Label>
      </Stack>

      <Box
        sx={{
          gap: 1.5,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          typography: 'body2',
          color: 'text.secondary',
        }}
      >
        <Box>Рождён: {litter.born_at ? fDate(litter.born_at) : '—'}</Box>
        <Box>
          Щенки: {litter.puppies_count ?? '—'} (♂{litter.males_count ?? '—'} / ♀
          {litter.females_count ?? '—'})
        </Box>
        <Box>Цена: {price}</Box>
        <Stack direction="row" spacing={1.5}>
          {litter.father_id && (
            <Link component={RouterLink} href={paths.showcase.dog(litter.father_id)}>
              Отец
            </Link>
          )}
          {litter.mother_id && (
            <Link component={RouterLink} href={paths.showcase.dog(litter.mother_id)}>
              Мать
            </Link>
          )}
        </Stack>
      </Box>

      {litter.description && (
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          {litter.description}
        </Typography>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/kennel/kennel-litter-card.tsx && npm run lint
git add src/sections/kennel/kennel-litter-card.tsx
git commit -m "feat(kennel): litter announcement card"
```

---

### Task 1.7: Kennel detail view + route

**Files:**
- Create: `src/sections/kennel/view/kennel-detail-view.tsx`
- Modify: `src/sections/kennel/view/index.ts` (if not already exporting detail view from Task 1.5)
- Create: `src/app/kennels/[id]/page.tsx`

- [ ] **Step 1: Implement the detail view**

`src/sections/kennel/view/kennel-detail-view.tsx`:

```tsx
'use client';

import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { fileUrl } from 'src/actions/file';
import { useGetDogs } from 'src/actions/dog';
import { useGetKennel } from 'src/actions/kennel';
import { useGetBreeds } from 'src/actions/reference';
import { useGetLittersList } from 'src/actions/litter';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { ProfileCover } from 'src/sections/user/profile-cover';
import { DogCardGrid } from 'src/sections/dog/dog-card-grid';

import { KennelLitterCard } from '../kennel-litter-card';

// ----------------------------------------------------------------------

type Props = { id: string };

export function KennelDetailView({ id }: Props) {
  const { kennel, kennelLoading } = useGetKennel(id);
  const { litters, littersLoading } = useGetLittersList({ kennel_id: id });
  const { dogs, dogsLoading } = useGetDogs({ kennel_id: id });
  const { breeds } = useGetBreeds();

  const breedNameById = Object.fromEntries(breeds.map((b) => [b.id, b.name]));

  if (kennelLoading) return <LoadingScreen />;
  if (!kennel) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>Питомник не найден.</Typography>
      </Container>
    );
  }

  const avatarUrl = fileUrl(kennel.avatar_file_id);

  const contacts = [
    kennel.contact_phone && {
      icon: 'solar:phone-bold',
      node: <Link href={`tel:${kennel.contact_phone}`}>{kennel.contact_phone}</Link>,
    },
    kennel.contact_email && {
      icon: 'solar:letter-bold',
      node: <Link href={`mailto:${kennel.contact_email}`}>{kennel.contact_email}</Link>,
    },
    kennel.website && {
      icon: 'solar:global-bold',
      node: (
        <Link href={kennel.website} target="_blank" rel="noopener">
          {kennel.website}
        </Link>
      ),
    },
  ].filter(Boolean) as { icon: string; node: React.ReactNode }[];

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Card sx={{ mb: 3, height: 290 }}>
        <ProfileCover
          name={kennel.name}
          role={kennel.kennel_prefix ?? ''}
          coverUrl={avatarUrl || ''}
          avatarUrl={avatarUrl || ''}
        />
      </Card>

      <Card sx={{ p: 3, mb: 5 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />
            <Typography variant="body2">
              {[kennel.city, kennel.country].filter(Boolean).join(', ') || '—'}
            </Typography>
          </Stack>
          {contacts.map((c) => (
            <Stack key={c.icon} direction="row" spacing={0.5} alignItems="center">
              <Iconify icon={c.icon} sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" component="span">
                {c.node}
              </Typography>
            </Stack>
          ))}
          {kennel.description && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {kennel.description}
            </Typography>
          )}
        </Stack>
      </Card>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Помёты (объявления)
      </Typography>
      {littersLoading ? (
        <LoadingScreen />
      ) : litters.length === 0 ? (
        <EmptyContent filled title="Помётов пока нет" sx={{ py: 6, mb: 5 }} />
      ) : (
        <Stack spacing={2} sx={{ mb: 5 }}>
          {litters.map((litter) => (
            <KennelLitterCard
              key={litter.id}
              litter={litter}
              breedName={breedNameById[litter.breed_id]}
            />
          ))}
        </Stack>
      )}

      <Typography variant="h5" sx={{ mb: 2 }}>
        Собаки питомника
      </Typography>
      {dogsLoading ? (
        <LoadingScreen />
      ) : dogs.length === 0 ? (
        <EmptyContent filled title="Собак пока нет" sx={{ py: 6 }} />
      ) : (
        <DogCardGrid dogs={dogs} breedNameById={breedNameById} />
      )}
    </Container>
  );
}
```

- [ ] **Step 2: Ensure export**

Confirm `src/sections/kennel/view/index.ts` contains `export * from './kennel-detail-view';` (added in Task 1.5 Step 2; add now if you deferred it).

- [ ] **Step 3: Create the route**

`src/app/kennels/[id]/page.tsx`:

```tsx
import { CONFIG } from 'src/global-config';

import { KennelDetailView } from 'src/sections/kennel/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Питомник - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <KennelDetailView id={id} />;
}
```

- [ ] **Step 4: Verify ProfileCover props**

Open `src/sections/user/profile-cover.tsx` and confirm its prop names (`name`, `role`, `coverUrl`, `avatarUrl`). If they differ, adjust the `<ProfileCover .../>` usage above to match the real signature.

- [ ] **Step 5: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/kennel/view/kennel-detail-view.tsx src/sections/kennel/view/index.ts "src/app/kennels/[id]/page.tsx" && npm run lint
npm test
git add src/sections/kennel/view src/app/kennels
git commit -m "feat(kennel): public detail page with litters + dogs"
```

---

## Phase 2 — Animals (classifieds)

### Task 2.1: Classified card + grid

**Files:**
- Create: `src/sections/classified/classified-card.tsx`
- Create: `src/sections/classified/classified-card-grid.tsx`

- [ ] **Step 1: Implement the card**

`src/sections/classified/classified-card.tsx`:

```tsx
import type { CardProps } from '@mui/material/Card';
import type { IClassifiedItem } from 'src/types/classified';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { fileUrl } from 'src/actions/file';

import { Label } from 'src/components/label';
import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';

import { primaryImageFileId, formatClassifiedPrice } from './classified-utils';

// ----------------------------------------------------------------------

const PLACEHOLDER = `${CONFIG.assetsDir}/assets/images/mock/cover/cover-9.webp`;

const CATEGORY_LABEL: Record<string, string> = {
  puppy_sale: 'Щенки',
  adult_sale: 'Взрослые',
  mating: 'Вязка',
  handler: 'Хендлер',
  grooming: 'Груминг',
  other: 'Другое',
};

type Props = CardProps & { classified: IClassifiedItem };

export function ClassifiedCard({ classified, sx, ...other }: Props) {
  const detailsHref = paths.showcase.classified(classified.id);
  const imageId = primaryImageFileId(classified.images);

  return (
    <Card sx={sx} {...other}>
      <Box sx={{ p: 1, position: 'relative' }}>
        <Label
          color="info"
          sx={{ position: 'absolute', top: 16, right: 16, zIndex: 9 }}
        >
          {CATEGORY_LABEL[classified.category] ?? classified.category}
        </Label>
        <Image
          alt={classified.title}
          src={imageId ? fileUrl(imageId) : PLACEHOLDER}
          ratio="4/3"
          sx={{ borderRadius: 1.5 }}
        />
      </Box>

      <ListItemText
        sx={{ p: (theme) => theme.spacing(1, 2.5, 0, 2.5) }}
        primary={
          <Link component={RouterLink} href={detailsHref} color="inherit">
            {classified.title}
          </Link>
        }
        secondary={formatClassifiedPrice(classified.price, classified.price_kind)}
        slotProps={{
          primary: { noWrap: true, sx: { typography: 'subtitle1' } },
          secondary: { sx: { mt: 0.5, typography: 'subtitle2', color: 'primary.main' } },
        }}
      />

      <Box
        sx={{
          p: 2.5,
          gap: 0.5,
          display: 'flex',
          alignItems: 'center',
          typography: 'body2',
          color: 'text.secondary',
        }}
      >
        <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />
        {classified.city ?? '—'}
      </Box>
    </Card>
  );
}
```

- [ ] **Step 2: Implement the grid**

`src/sections/classified/classified-card-grid.tsx`:

```tsx
import type { IClassifiedItem } from 'src/types/classified';

import Box from '@mui/material/Box';

import { ClassifiedCard } from './classified-card';

// ----------------------------------------------------------------------

type Props = { classifieds: IClassifiedItem[] };

export function ClassifiedCardGrid({ classifieds }: Props) {
  return (
    <Box
      sx={{
        gap: 3,
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
      }}
    >
      {classifieds.map((item) => (
        <ClassifiedCard key={item.id} classified={item} />
      ))}
    </Box>
  );
}
```

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/classified/classified-card.tsx src/sections/classified/classified-card-grid.tsx && npm run lint
git add src/sections/classified/classified-card.tsx src/sections/classified/classified-card-grid.tsx
git commit -m "feat(classified): showcase card + grid"
```

---

### Task 2.2: Classified showcase list view + route

**Files:**
- Create: `src/sections/classified/view/classified-showcase-view.tsx`
- Modify: `src/sections/classified/view/index.ts`
- Create: `src/app/animals/layout.tsx`
- Create: `src/app/animals/page.tsx`

- [ ] **Step 1: Implement the showcase view**

`src/sections/classified/view/classified-showcase-view.tsx`:

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useSetState } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import { useGetClassifieds } from 'src/actions/classified';
import { CLASSIFIED_CATEGORIES } from 'src/types/classified';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { ShowcaseShell } from 'src/sections/showcase';

import { ClassifiedCardGrid } from '../classified-card-grid';

// ----------------------------------------------------------------------

const CATEGORY_LABEL: Record<string, string> = {
  puppy_sale: 'Щенки',
  adult_sale: 'Взрослые',
  mating: 'Вязка',
  handler: 'Хендлер',
  grooming: 'Груминг',
  other: 'Другое',
};

export function ClassifiedShowcaseView() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const filters = useSetState<{ search: string; category: string; city: string }>({
    search: '',
    category: 'all',
    city: '',
  });
  const { state, setState } = filters;

  const { classifieds, classifiedsTotal, classifiedsLoading, classifiedsEmpty } =
    useGetClassifieds({
      page: page + 1,
      per_page: rowsPerPage,
      category: state.category === 'all' ? undefined : state.category,
      city: state.city || undefined,
    });

  // Backend list does not filter by status yet — keep only active publicly.
  const visible = classifieds.filter((c) => c.status === 'active');

  // Client-side search within the current page (backend has no `search` param).
  const filtered = state.search
    ? visible.filter((c) => c.title.toLowerCase().includes(state.search.toLowerCase()))
    : visible;

  const handleField = useCallback(
    (field: 'search' | 'category' | 'city', value: string) => {
      setPage(0);
      setState({ [field]: value });
    },
    [setState]
  );

  return (
    <ShowcaseShell title="Животные — объявления">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: { xs: 3, md: 5 } }}>
        <TextField
          fullWidth
          value={state.search}
          onChange={(e) => handleField('search', e.target.value)}
          placeholder="Поиск по заголовку..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          value={state.category}
          onChange={(e) => handleField('category', e.target.value)}
          sx={{ width: { xs: 1, sm: 200 } }}
        >
          <MenuItem value="all">Все категории</MenuItem>
          {CLASSIFIED_CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          value={state.city}
          onChange={(e) => handleField('city', e.target.value)}
          placeholder="Город"
          sx={{ width: { xs: 1, sm: 200 } }}
        />
      </Stack>

      {classifiedsLoading ? (
        <LoadingScreen />
      ) : classifiedsEmpty || filtered.length === 0 ? (
        <EmptyContent filled title="Объявления не найдены" sx={{ py: 10 }} />
      ) : (
        <>
          <ClassifiedCardGrid classifieds={filtered} />
          <TablePagination
            component="div"
            page={page}
            count={classifiedsTotal}
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
    </ShowcaseShell>
  );
}
```

- [ ] **Step 2: Export + route**

In `src/sections/classified/view/index.ts` add:

```ts
export * from './classified-showcase-view';
export * from './classified-detail-view';
```

(`classified-detail-view` created in Task 2.3 — add only `classified-showcase-view` now if executing strictly task-by-task.)

`src/app/animals/layout.tsx`:

```tsx
import { MainLayout } from 'src/layouts/main';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
```

`src/app/animals/page.tsx`:

```tsx
import { CONFIG } from 'src/global-config';

import { ClassifiedShowcaseView } from 'src/sections/classified/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Животные - ${CONFIG.appName}` };

export default function Page() {
  return <ClassifiedShowcaseView />;
}
```

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/classified/view/classified-showcase-view.tsx src/sections/classified/view/index.ts src/app/animals/layout.tsx src/app/animals/page.tsx && npm run lint
git add src/sections/classified/view/classified-showcase-view.tsx src/sections/classified/view/index.ts src/app/animals
git commit -m "feat(classified): public showcase grid at /animals"
```

---

### Task 2.3: Classified detail view + route

**Files:**
- Create: `src/sections/classified/view/classified-detail-view.tsx`
- Modify: `src/sections/classified/view/index.ts` (if not done in Task 2.2)
- Create: `src/app/animals/[id]/page.tsx`

- [ ] **Step 1: Implement the detail view**

`src/sections/classified/view/classified-detail-view.tsx`:

```tsx
'use client';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { fileUrl } from 'src/actions/file';
import { useGetBreeds } from 'src/actions/reference';
import { useGetClassified } from 'src/actions/classified';

import { Label } from 'src/components/label';
import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';
import { Lightbox, useLightbox } from 'src/components/lightbox';
import { LoadingScreen } from 'src/components/loading-screen';

import { formatClassifiedPrice } from '../classified-utils';

// ----------------------------------------------------------------------

const CATEGORY_LABEL: Record<string, string> = {
  puppy_sale: 'Щенки',
  adult_sale: 'Взрослые',
  mating: 'Вязка',
  handler: 'Хендлер',
  grooming: 'Груминг',
  other: 'Другое',
};

type Props = { id: string };

export function ClassifiedDetailView({ id }: Props) {
  const { classified, classifiedLoading } = useGetClassified(id);
  const { breeds } = useGetBreeds();

  const slides = (classified?.images ?? []).map((img) => ({ src: fileUrl(img.file_id) }));
  const lightbox = useLightbox(slides);

  if (classifiedLoading) return <LoadingScreen />;
  if (!classified) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>Объявление не найдено.</Typography>
      </Container>
    );
  }

  const breedName = breeds.find((b) => b.id === classified.breed_id)?.name;

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      {slides.length > 0 && (
        <>
          <Box
            sx={{
              gap: 1,
              display: 'grid',
              mb: { xs: 3, md: 5 },
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
            }}
          >
            {slides.slice(0, 4).map((slide) => (
              <Image
                key={slide.src}
                alt={classified.title}
                src={slide.src}
                ratio="1/1"
                onClick={() => lightbox.onOpen(slide.src)}
                sx={{ borderRadius: 2, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
              />
            ))}
          </Box>
          <Lightbox
            index={lightbox.selected}
            slides={slides}
            open={lightbox.open}
            close={lightbox.onClose}
          />
        </>
      )}

      <Box sx={{ mx: 'auto', maxWidth: 720 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {classified.title}
          </Typography>
          <Label color="info">{CATEGORY_LABEL[classified.category] ?? classified.category}</Label>
        </Stack>

        <Typography variant="h5" sx={{ color: 'primary.main', mb: 2 }}>
          {formatClassifiedPrice(classified.price, classified.price_kind)}
        </Typography>

        <Stack direction="row" flexWrap="wrap" spacing={3} sx={{ typography: 'body2' }}>
          {breedName && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Iconify icon="solar:dna-bold" sx={{ color: 'info.main' }} />
              {breedName}
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />
            {classified.city ?? '—'}
          </Box>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed', my: 4 }} />

        <Markdown children={classified.description} />

        {(classified.contact_phone || classified.contact_email) && (
          <>
            <Divider sx={{ borderStyle: 'dashed', my: 4 }} />
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Контакты
            </Typography>
            <Stack spacing={1}>
              {classified.contact_phone && (
                <Link href={`tel:${classified.contact_phone}`}>{classified.contact_phone}</Link>
              )}
              {classified.contact_email && (
                <Link href={`mailto:${classified.contact_email}`}>
                  {classified.contact_email}
                </Link>
              )}
            </Stack>
          </>
        )}

      </Box>
    </Container>
  );
}
```

Note: `classified.litter_id` is intentionally NOT linked — there is no public litter route, and a litter id is not a dog id (linking it to `/dogs/[id]` would be wrong). If a public litter page is added later, wire the link then. Because of this, `RouterLink`/`paths` are not imported in this file; remove them from the import list if your editor flags them as unused (run `eslint --fix`).

- [ ] **Step 2: Ensure export + route**

Confirm `src/sections/classified/view/index.ts` exports `classified-detail-view` (add if deferred).

`src/app/animals/[id]/page.tsx`:

```tsx
import { CONFIG } from 'src/global-config';

import { ClassifiedDetailView } from 'src/sections/classified/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Объявление - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ClassifiedDetailView id={id} />;
}
```

- [ ] **Step 3: Verify `useLightbox` API**

Open `src/components/lightbox` index and confirm `useLightbox` returns `{ selected, open, onOpen, onClose }` (as used in `tour-details-content.tsx`). Adjust destructuring if names differ.

- [ ] **Step 4: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/classified/view/classified-detail-view.tsx src/sections/classified/view/index.ts "src/app/animals/[id]/page.tsx" && npm run lint
git add src/sections/classified/view src/app/animals
git commit -m "feat(classified): public detail page with gallery"
```

---

## Phase 3 — Shows

### Task 3.1: Show card + grid

**Files:**
- Create: `src/sections/show/show-card.tsx`
- Create: `src/sections/show/show-card-grid.tsx`

- [ ] **Step 1: Implement the card**

`src/sections/show/show-card.tsx`:

```tsx
import type { CardProps } from '@mui/material/Card';
import type { IShowItem } from 'src/types/show';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_LABEL: Record<string, string> = {
  registration_open: 'Регистрация открыта',
  registration_closed: 'Регистрация закрыта',
  in_progress: 'Идёт',
  completed: 'Завершена',
};

type Props = CardProps & { show: IShowItem };

export function ShowCard({ show, sx, ...other }: Props) {
  const detailsHref = paths.showcase.show(show.id);
  const dates = show.date_end
    ? `${fDate(show.date_start)} – ${fDate(show.date_end)}`
    : fDate(show.date_start);

  const rows = [
    { icon: 'solar:calendar-date-bold', label: dates },
    {
      icon: 'mingcute:location-fill',
      label: [show.city, show.country].filter(Boolean).join(', ') || '—',
    },
    { icon: 'solar:map-point-bold', label: show.venue ?? '—' },
    { icon: 'solar:tag-price-bold', label: show.entry_fee != null ? fCurrency(show.entry_fee) : '—' },
  ];

  return (
    <Card sx={{ p: 3, ...sx }} {...other}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
        <Link component={RouterLink} href={detailsHref} color="inherit" variant="subtitle1">
          {show.name}
        </Link>
        <Label color={show.status === 'completed' ? 'default' : 'success'}>
          {STATUS_LABEL[show.status] ?? show.status}
        </Label>
      </Stack>

      <Stack spacing={1}>
        {rows.map((r) => (
          <Box key={r.icon} sx={{ display: 'flex', gap: 0.75, alignItems: 'center', typography: 'body2' }}>
            <Iconify icon={r.icon} sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {r.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Card>
  );
}
```

- [ ] **Step 2: Implement the grid**

`src/sections/show/show-card-grid.tsx`:

```tsx
import type { IShowItem } from 'src/types/show';

import Box from '@mui/material/Box';

import { ShowCard } from './show-card';

// ----------------------------------------------------------------------

type Props = { shows: IShowItem[] };

export function ShowCardGrid({ shows }: Props) {
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
        <ShowCard key={show.id} show={show} />
      ))}
    </Box>
  );
}
```

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/show/show-card.tsx src/sections/show/show-card-grid.tsx && npm run lint
git add src/sections/show/show-card.tsx src/sections/show/show-card-grid.tsx src/components/iconify/icon-sets.ts
git commit -m "feat(show): showcase card + grid"
```

(If `solar:map-point-bold`/`solar:tag-price-bold` aren't registered, add them to `icon-sets.ts` or swap for registered equivalents before committing.)

---

### Task 3.2: Show showcase list view + route

**Files:**
- Create: `src/sections/show/view/show-showcase-view.tsx`
- Modify: `src/sections/show/view/index.ts`
- Create: `src/app/shows/layout.tsx`
- Create: `src/app/shows/page.tsx`

- [ ] **Step 1: Implement the showcase view**

`src/sections/show/view/show-showcase-view.tsx`:

```tsx
'use client';

import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TablePagination from '@mui/material/TablePagination';

import { useGetShows } from 'src/actions/show';

import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { ShowcaseShell } from 'src/sections/showcase';

import { ShowCardGrid } from '../show-card-grid';
import { classifyShow } from '../show-utils';

// ----------------------------------------------------------------------

type Bucket = 'upcoming' | 'past';

export function ShowShowcaseView() {
  const [bucket, setBucket] = useState<Bucket>('upcoming');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Fetch a page; classify client-side (backend has a single `status`, not a bucket).
  const { shows, showsTotal, showsLoading, showsEmpty } = useGetShows({
    page: page + 1,
    per_page: rowsPerPage,
  });

  const visible = shows.filter((s) => classifyShow(s.status) === bucket);

  const handleBucket = (_e: React.SyntheticEvent, value: Bucket) => {
    setBucket(value);
    setPage(0);
  };

  return (
    <ShowcaseShell title="Выставки">
      <Tabs value={bucket} onChange={handleBucket} sx={{ mb: { xs: 3, md: 5 } }}>
        <Tab value="upcoming" label="Планируемые" />
        <Tab value="past" label="Прошедшие" />
      </Tabs>

      {showsLoading ? (
        <LoadingScreen />
      ) : showsEmpty || visible.length === 0 ? (
        <EmptyContent filled title="Выставок не найдено" sx={{ py: 10 }} />
      ) : (
        <>
          <ShowCardGrid shows={visible} />
          <TablePagination
            component="div"
            page={page}
            count={showsTotal}
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
    </ShowcaseShell>
  );
}
```

- [ ] **Step 2: Export + route**

In `src/sections/show/view/index.ts` add:

```ts
export * from './show-showcase-view';
export * from './show-public-detail-view';
```

(`show-public-detail-view` created in Task 3.3 — add only `show-showcase-view` now if executing strictly task-by-task.)

`src/app/shows/layout.tsx`:

```tsx
import { MainLayout } from 'src/layouts/main';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
```

`src/app/shows/page.tsx`:

```tsx
import { CONFIG } from 'src/global-config';

import { ShowShowcaseView } from 'src/sections/show/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Выставки - ${CONFIG.appName}` };

export default function Page() {
  return <ShowShowcaseView />;
}
```

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/show/view/show-showcase-view.tsx src/sections/show/view/index.ts src/app/shows/layout.tsx src/app/shows/page.tsx && npm run lint
npm test
git add src/sections/show/view/show-showcase-view.tsx src/sections/show/view/index.ts src/app/shows
git commit -m "feat(show): public showcase grid at /shows"
```

---

### Task 3.3: Show public detail view (+ results) + route

**Files:**
- Create: `src/sections/show/view/show-public-detail-view.tsx`
- Modify: `src/sections/show/view/index.ts` (if not done in Task 3.2)
- Create: `src/app/shows/[id]/page.tsx`

- [ ] **Step 1: Implement the detail view**

`src/sections/show/view/show-public-detail-view.tsx`:

```tsx
'use client';

import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Container from '@mui/material/Container';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fetcher, endpoints } from 'src/lib/axios';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useGetShow } from 'src/actions/show';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const STATUS_LABEL: Record<string, string> = {
  registration_open: 'Регистрация открыта',
  registration_closed: 'Регистрация закрыта',
  in_progress: 'Идёт',
  completed: 'Завершена',
};

type ShowResult = {
  id: string;
  dog_id: string;
  place: number | null;
  award: string | null;
};

type Props = { id: string };

export function ShowPublicDetailView({ id }: Props) {
  const { show, showLoading } = useGetShow(id);

  const isCompleted = show?.status === 'completed';
  const { data: results } = useSWR<ShowResult[]>(
    isCompleted ? endpoints.show.results(id) : null,
    fetcher
  );

  if (showLoading) return <LoadingScreen />;
  if (!show) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>Выставка не найдена.</Typography>
      </Container>
    );
  }

  const overview = [
    {
      label: 'Даты',
      value: show.date_end
        ? `${fDate(show.date_start)} – ${fDate(show.date_end)}`
        : fDate(show.date_start),
    },
    { label: 'Город', value: [show.city, show.country].filter(Boolean).join(', ') || '—' },
    { label: 'Площадка', value: show.venue ?? '—' },
    { label: 'Взнос', value: show.entry_fee != null ? fCurrency(show.entry_fee) : '—' },
    {
      label: 'Дедлайн регистрации',
      value: show.registration_deadline ? fDate(show.registration_deadline) : '—',
    },
  ];

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {show.name}
        </Typography>
        <Label color={isCompleted ? 'default' : 'success'}>
          {STATUS_LABEL[show.status] ?? show.status}
        </Label>
      </Stack>

      <Card sx={{ p: 3, mb: 5 }}>
        <Box
          sx={{
            gap: 3,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          {overview.map((item) => (
            <ListItemText
              key={item.label}
              primary={item.label}
              secondary={item.value}
              slotProps={{
                primary: { sx: { typography: 'body2', color: 'text.secondary' } },
                secondary: { sx: { mt: 0.5, typography: 'subtitle2', color: 'text.primary' } },
              }}
            />
          ))}
        </Box>

        {show.description && (
          <>
            <Divider sx={{ borderStyle: 'dashed', my: 3 }} />
            <Typography variant="body2">{show.description}</Typography>
          </>
        )}
      </Card>

      {isCompleted && (
        <>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Результаты
          </Typography>
          <Card>
            <Scrollbar>
              <Table sx={{ minWidth: 480 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Место</TableCell>
                    <TableCell>Собака</TableCell>
                    <TableCell>Награда</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(results ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.place ?? '—'}</TableCell>
                      <TableCell>{r.dog_id}</TableCell>
                      <TableCell>{r.award ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                  {(!results || results.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>
                        Результаты пока не опубликованы.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </Card>
        </>
      )}
    </Container>
  );
}
```

- [ ] **Step 2: Verify results shape**

Open `src/sections/show/view/show-results-view.tsx` and confirm the result item field names (`place`, `award`, `dog_id`). If the real shape differs, update the `ShowResult` type and the cells. (Showing `dog_id` raw is acceptable for v1; link to `/dogs/[id]` if a dog name is available.)

- [ ] **Step 3: Ensure export + route**

Confirm `src/sections/show/view/index.ts` exports `show-public-detail-view`.

`src/app/shows/[id]/page.tsx`:

```tsx
import { CONFIG } from 'src/global-config';

import { ShowPublicDetailView } from 'src/sections/show/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Выставка - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ShowPublicDetailView id={id} />;
}
```

- [ ] **Step 4: Verify + commit**

```bash
npx tsc --noEmit
npx eslint --fix src/sections/show/view/show-public-detail-view.tsx src/sections/show/view/index.ts "src/app/shows/[id]/page.tsx" && npm run lint
git add src/sections/show/view src/app/shows
git commit -m "feat(show): public detail page with results"
```

---

## Final verification

- [ ] **Step 1: Full gate run**

```bash
npx tsc --noEmit
npm run lint
npm test
```
Expected: tsc 0 errors, lint 0 errors, all tests green.

- [ ] **Step 2: Runtime smoke (backend must answer at :8000/health/)**

Start dev server, then visit (logged out): `/kennels`, a kennel detail, `/dogs/<id>`, `/animals`, an animal detail, `/shows` (both tabs), a completed show detail. Confirm grids render, cards link correctly, and no console errors. If the backend is down, skip runtime and rely on the gates.

- [ ] **Step 3: Update roadmap (optional)**

If `docs/plans/2026-06-01-frontend-roadmap.md` tracks this work, mark the public showcase done and commit.

---

## Notes / known limitations (updated 2026-06-03 — backend contract landed)

- **Sorting** is now **server-side** via `sort_by`/`order` (see Addendum). No client-side sort.
- **Dog photos** are now real (`avatar_file_id` + `photo_file_ids`); `dogPlaceholderImage` remains only as a fallback when a dog has no photos.
- **Classifieds status filter** is still client-side (`status==='active'`) — `GET /classifieds` did **not** gain a `status` param; pagination counts include non-active items until it does.
- **Shows upcoming tab** still classifies client-side (the "upcoming" bucket spans 3 statuses and the backend `status` filter is single-value); the **past tab** filters `status='completed'` server-side (see Addendum).

---

## Addendum — 2026-06-03 backend contract integration

The backend now returns/accepts:
- `DogResponse`: `avatar_file_id: string|null`, `photo_file_ids: string[]`, `litter_id: string|null`; `GET /dogs` accepts `litter_id`, `sort_by` (`name|date_of_birth|created_at`), `order` (`asc|desc`).
- `KennelResponse`: `is_verified: boolean`, `dogs_count: number`, `litters_count: number`; `GET /kennels` accepts `sort_by` (`name|created_at`), `order`.
- `LitterResponse`: `father: IDogRef|null`, `mother: IDogRef|null` (`IDogRef = {id, name, avatar_file_id}`); new `GET /litters/{id}/puppies` → `IDogItem[]` (hook `useGetLitterPuppies`).
- `GET /classifieds` accepts `sort_by` (`created_at|price|views_count`), `order`. `GET /shows` accepts `sort_by` (`date_start|created_at`), `order`, and `status`.

Types/actions are already updated and committed. Apply these code deltas when doing the listed tasks:

### Delta for Task 1.2 (DogCard) — real photo with placeholder fallback

Add import `import { fileUrl } from 'src/actions/file';` and change the `<Image>` `src`:

```tsx
src={fileUrl(dog.avatar_file_id) || dogPlaceholderImage(dog.sex)}
```

### Delta for Task 1.3 (DogPublicDetailView) — gallery from real photos

Add imports:

```tsx
import { fileUrl } from 'src/actions/file';
import { Lightbox, useLightbox } from 'src/components/lightbox';
```

Replace the single placeholder hero `<Image .../>` with a gallery built from the dog's photos (avatar first, then `photo_file_ids`, de-duplicated), falling back to the sex placeholder when the dog has no photos. Insert this right after the `breedName`/`overview` setup but compute `slides`/`lightbox` at the top of the component (hooks must run unconditionally, before the early returns — place the two lines just after the `useGetBreeds()` hook call):

```tsx
  const photoIds = [dog?.avatar_file_id, ...(dog?.photo_file_ids ?? [])].filter(
    (v, i, arr): v is string => !!v && arr.indexOf(v) === i
  );
  const slides = photoIds.map((fid) => ({ src: fileUrl(fid) }));
  const lightbox = useLightbox(slides);
```

(Note: `dog` may be undefined on first render — the `dog?.` guards handle that; the early `if (!dog)` return stays *after* these hook calls.)

Then the hero render block becomes:

```tsx
      {slides.length > 0 ? (
        <>
          <Box
            sx={{
              gap: 1,
              display: 'grid',
              mb: { xs: 3, md: 5 },
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
            }}
          >
            {slides.slice(0, 4).map((slide) => (
              <Image
                key={slide.src}
                alt={dog.name}
                src={slide.src}
                ratio="1/1"
                onClick={() => lightbox.onOpen(slide.src)}
                sx={{ borderRadius: 2, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
              />
            ))}
          </Box>
          <Lightbox
            index={lightbox.selected}
            slides={slides}
            open={lightbox.open}
            close={lightbox.onClose}
          />
        </>
      ) : (
        <Image
          alt={dog.name}
          src={dogPlaceholderImage(dog.sex)}
          ratio="16/9"
          sx={{ borderRadius: 2, mb: { xs: 3, md: 5 } }}
        />
      )}
```

Keep `dogPlaceholderImage` import (used in the fallback). Ensure `Box` is imported (it already is in the task body).

### Delta for Task 1.4 (KennelCard) — verified badge + counts

Add a verified `Label` overlay on the image and a counts row. Add imports `import { Label } from 'src/components/label';` (Iconify already imported). Wrap the image `<Box sx={{ p: 1 }}>` to be `position: 'relative'` and add inside it, before `<Image>`:

```tsx
        {kennel.is_verified && (
          <Label
            color="success"
            startIcon={<Iconify icon="solar:verified-check-bold" />}
            sx={{ position: 'absolute', top: 16, right: 16, zIndex: 9 }}
          >
            Проверен
          </Label>
        )}
```

And change the location `<Box>` footer to also show counts (replace the single location Box with):

```tsx
      <Box sx={{ p: 2.5, pt: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', typography: 'body2' }}>
          <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />
          {location}
        </Box>
        <Box sx={{ typography: 'caption', color: 'text.disabled' }}>
          Собак: {kennel.dogs_count} · Помётов: {kennel.litters_count}
        </Box>
      </Box>
```

(If `solar:verified-check-bold` is not registered in `icon-sets.ts`, add it or swap for a registered check icon like `solar:check-circle-bold`.)

### Delta for Task 1.5 (KennelShowcaseView) — server sort control

Add a sort `Select` (MUI `TextField select`) with options "Сначала новые" (`created_at`/`desc`) and "По названию" (`name`/`asc`), store `sortBy`/`order` in state, and pass them to the hook:

```tsx
  const { kennels, kennelsTotal, kennelsLoading, kennelsEmpty } = useGetKennelsList({
    page: page + 1,
    per_page: rowsPerPage,
    search: currentFilters.search || undefined,
    city: currentFilters.city || undefined,
    sort_by: sortBy,
    order,
  });
```

Add to the filter row a `TextField select` bound to a single `sort` state of form `'created_at:desc' | 'name:asc'`, split into `sort_by`/`order` (`const [sort_by, order] = sort.split(':')`). Remove any client-side `orderBy` (the task body has none — lists were already server-paged). Keep it simple: one select, two options.

### Delta for Task 1.6 (KennelLitterCard) — use embedded father/mother objects

Replace the parents `<Stack>` (which linked by `father_id`/`mother_id` with the static label "Отец"/"Мать") with links that use the embedded objects' names, falling back to the id-based link:

```tsx
        <Stack direction="row" spacing={1.5}>
          {litter.father && (
            <Link component={RouterLink} href={paths.showcase.dog(litter.father.id)}>
              ♂ {litter.father.name}
            </Link>
          )}
          {litter.mother && (
            <Link component={RouterLink} href={paths.showcase.dog(litter.mother.id)}>
              ♀ {litter.mother.name}
            </Link>
          )}
        </Stack>
```

### Delta for Task 1.7 (KennelDetailView) — verified badge in header

After the `<ProfileCover .../>` card (or in the info `Card`), show the verified state. Add `import { Label } from 'src/components/label';` and render near the location line:

```tsx
          {kennel.is_verified && (
            <Label color="success" startIcon={<Iconify icon="solar:verified-check-bold" />}>
              Проверенный питомник
            </Label>
          )}
```

No per-litter puppies fetch is required (the "Собаки питомника" grid already lists the kennel's dogs). `useGetLitterPuppies` exists for future per-litter expansion but is out of scope here.

### Delta for Task 2.2 (ClassifiedShowcaseView) — server sort

Pass sort to the hook and add a sort `Select` (options: "Сначала новые" `created_at:desc`, "Дешевле" `price:asc`, "Дороже" `price:desc`, "Популярные" `views_count:desc`):

```tsx
  const { classifieds, classifiedsTotal, classifiedsLoading, classifiedsEmpty } =
    useGetClassifieds({
      page: page + 1,
      per_page: rowsPerPage,
      category: state.category === 'all' ? undefined : state.category,
      city: state.city || undefined,
      sort_by,
      order,
    });
```

Keep the client-side `status === 'active'` filter and client-side title search (backend `GET /classifieds` has no `status`/`search`; `/classifieds/search` is separate and out of scope).

### Delta for Task 3.2 (ShowShowcaseView) — server status (past) + sort

For the **past** tab, fetch with `status: 'completed'` and `sort_by: 'date_start', order: 'desc'`; for the **upcoming** tab, fetch without `status`, `sort_by: 'date_start', order: 'asc'`, and keep the client-side `classifyShow(...) === 'upcoming'` filter (the bucket spans 3 statuses):

```tsx
  const { shows, showsTotal, showsLoading, showsEmpty } = useGetShows({
    page: page + 1,
    per_page: rowsPerPage,
    status: bucket === 'past' ? 'completed' : undefined,
    sort_by: 'date_start',
    order: bucket === 'past' ? 'desc' : 'asc',
  });

  const visible =
    bucket === 'past' ? shows : shows.filter((s) => classifyShow(s.status) === 'upcoming');
```
