# Ownership-aware права на собак + «Мои собаки» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Фронт отражает бэкендовую модель владения `Dog.owner_id`: любой авторизованный создаёт собак, владелец управляет своими без питомника, у каждого — личный раздел «Мои собаки».

**Architecture:** Чистый хелпер `canManageDog` (зеркало бэкендовского `_can_manage_dog`) + право `dogs:create` всем ролям в матрице + ownership-aware кнопки в dog-срезе + новая страница `/dashboard/my-dogs` на `GET /users/me/dogs`, переиспользующая таблицу dog-среза. Спека: `docs/superpowers/specs/2026-06-10-dog-ownership-design.md`.

**Tech Stack:** Next.js 16 App Router, MUI 7 (Minimal Kit), SWR, vitest. Гейты перед каждым коммитом: `npx tsc --noEmit`, `npx eslint <files>`, `npx vitest run`.

**Контекст для исполнителя (без него код не скомпилится):**
- `useAuthContext()` (`src/auth/hooks`) отдаёт `user` — сырой `/users/me`, у него есть `id` (тип `Record<string, any>`, обращение `user?.id`).
- `usePermissions()` (`src/hooks/use-permissions`) отдаёт `can(perm)`; каскад: право `dogs` покрывает `dogs:edit`, `*` покрывает всё (`src/utils/permissions.ts`).
- `IDogItem` (`src/types/dog.ts`) уже содержит `owner_id: string | null`.
- Дашборд-layout (`src/app/dashboard/layout.tsx`) уже обёрнут в `AuthGuard`.
- `GET /users/me/dogs` отдаёт `{items,total,page,per_page}` и принимает `page`/`per_page` (проверено по OpenAPI).
- Иконки `mingcute:add-line`, `solar:pen-bold`, `solar:eye-bold`, `eva:more-vertical-fill` уже в реестре (используются в dog-срезе).

---

### Task 1: Хелпер `canManageDog` (TDD)

**Files:**
- Modify: `src/sections/dog/dog-utils.ts`
- Test: `src/sections/dog/__tests__/dog-utils.test.ts` (дописать в существующий файл)

- [ ] **Step 1: Write the failing test**

Дописать в конец `src/sections/dog/__tests__/dog-utils.test.ts`:

```ts
describe('canManageDog', () => {
  const canNothing = () => false;
  const canDogsEdit = (p: string) => p === 'dogs:edit';

  it('владелец по owner_id управляет без пермиссий', () => {
    expect(canManageDog({ owner_id: 'u1' }, 'u1', canNothing)).toBe(true);
  });

  it('чужая собака без dogs:edit — нет доступа', () => {
    expect(canManageDog({ owner_id: 'u2' }, 'u1', canNothing)).toBe(false);
  });

  it('dogs:edit (breeder/admin) даёт доступ независимо от владения', () => {
    expect(canManageDog({ owner_id: 'u2' }, 'u1', canDogsEdit)).toBe(true);
    expect(canManageDog({ owner_id: null }, 'u1', canDogsEdit)).toBe(true);
  });

  it('легаси-собака (owner_id=null) — только по праву', () => {
    expect(canManageDog({ owner_id: null }, 'u1', canNothing)).toBe(false);
  });

  it('без userId (сессия не загружена) — нет доступа', () => {
    expect(canManageDog({ owner_id: 'u1' }, undefined, canNothing)).toBe(false);
    expect(canManageDog({ owner_id: 'u1' }, null, canNothing)).toBe(false);
  });
});
```

В импорт из `'../dog-utils'` в начале файла добавить `canManageDog`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sections/dog/__tests__/dog-utils.test.ts`
Expected: FAIL — `canManageDog` is not exported.

- [ ] **Step 3: Write minimal implementation**

В `src/sections/dog/dog-utils.ts`: импорт типа сверху заменить на

```ts
import type { DogSex, IDogItem } from 'src/types/dog';
```

и дописать в конец файла:

```ts
// ----------------------------------------------------------------------

/**
 * Может ли пользователь управлять собакой (edit/delete/фото).
 * Зеркало бэкендовского `_can_manage_dog` (app/services/dog.py) с упрощением:
 * ветка «владелец питомника» на фронте покрыта правом `dogs:edit` (breeder),
 * бэкенд всё равно перепроверяет. owner_id=null (легаси) — только по праву.
 */
export function canManageDog(
  dog: Pick<IDogItem, 'owner_id'>,
  userId: string | null | undefined,
  can: (perm: string) => boolean
): boolean {
  return can('dogs:edit') || (!!userId && dog.owner_id === userId);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sections/dog/__tests__/dog-utils.test.ts`
Expected: PASS (все describe-блоки).

- [ ] **Step 5: Commit**

```bash
git add src/sections/dog/dog-utils.ts src/sections/dog/__tests__/dog-utils.test.ts
git commit -m "feat(dogs): canManageDog helper — mirror backend owner_id rights

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `dogs:create` всем ролям в матрице (TDD)

**Files:**
- Modify: `src/config/permissions.ts:10-17`
- Test: `src/config/__tests__/permissions.test.ts` (дописать)

- [ ] **Step 1: Write the failing test**

Дописать в конец `src/config/__tests__/permissions.test.ts`:

```ts
describe('dogs:create (зеркало бэкенда: создать собаку может любой авторизованный)', () => {
  it('есть у всех ролей', () => {
    ROLES_LIST.forEach((role) => {
      expect(can('dogs:create', getPermissionsForRole(role))).toBe(true);
    });
  });

  it('dogs:edit по-прежнему только у breeder/admin', () => {
    expect(can('dogs:edit', getPermissionsForRole('buyer'))).toBe(false);
    expect(can('dogs:edit', getPermissionsForRole('organizer'))).toBe(false);
    expect(can('dogs:edit', getPermissionsForRole('breeder'))).toBe(true);
    expect(can('dogs:edit', getPermissionsForRole('admin'))).toBe(true);
  });
});
```

(`can`, `getPermissionsForRole`, `ROLES_LIST` уже импортированы в этом файле.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/config/__tests__/permissions.test.ts`
Expected: FAIL — у organizer/judge/buyer/operator нет `dogs:create`.

- [ ] **Step 3: Write minimal implementation**

В `src/config/permissions.ts` добавить `'dogs:create'` в массивы organizer, judge, buyer, operator (breeder покрыт `dogs`, admin — `*`):

```ts
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['*'],
  organizer: ['dashboard:view', 'shows', 'results', 'documents', 'references:view', 'ads', 'kennels:view', 'litters:view', 'classifieds:view', 'support:view', 'support:create', 'dogs:create'],
  breeder: ['dashboard:view', 'dogs', 'kennels', 'litters', 'classifieds', 'shows:view', 'references:view', 'support:view', 'support:create'],
  judge: ['dashboard:view', 'shows:view', 'results:create', 'results:edit', 'documents', 'references:view', 'kennels:view', 'litters:view', 'classifieds:view', 'support:view', 'support:create', 'dogs:create'],
  buyer: ['dashboard:view', 'classifieds:view', 'dogs:view', 'dogs:create', 'references:view', 'kennels:view', 'litters:view', 'shows:view', 'support:view', 'support:create'],
  operator: ['dashboard:view', 'support', 'classifieds:view', 'references:view', 'kennels:view', 'litters:view', 'shows:view', 'dogs:create'],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/config/__tests__/permissions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/config/permissions.ts src/config/__tests__/permissions.test.ts
git commit -m "feat(rbac): dogs:create for all roles — mirror backend create policy

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Путь `/dashboard/my-dogs` + перенацеливание drawer (TDD)

**Files:**
- Modify: `src/routes/paths.ts:159-162` (рядом с `myShows`)
- Modify: `src/layouts/account/account-nav.ts:27-32`
- Test: `src/layouts/account/account-nav.test.ts` (переписать describe `getMyObjectLinks`)

- [ ] **Step 1: Добавить путь**

В `src/routes/paths.ts` сразу после блока `myShows` (строки 159-162):

```ts
    myDogs: {
      root: `${ROOTS.DASHBOARD}/my-dogs`,
    },
```

- [ ] **Step 2: Write the failing test**

В `src/layouts/account/account-nav.test.ts` заменить describe `getMyObjectLinks` целиком на (тесты используют боевой движок прав, а не самодельные фейки — чтобы каскад `dogs` → `dogs:create` был проверен честно):

```ts
import { can as canPerm } from 'src/utils/permissions';

const canFor = (granted: string[]) => (p: string) => canPerm(p, granted);

describe('getMyObjectLinks', () => {
  it('breeder (полные права) видит все три ссылки; dogs ведёт в личный раздел', () => {
    const links = getMyObjectLinks(canFor(['kennels', 'dogs', 'litters']));
    expect(links.map((l) => l.key)).toEqual(['kennels', 'dogs', 'litters']);
    expect(links[0].href).toBe(paths.dashboard.kennels.root);
    expect(links[1].href).toBe(paths.dashboard.myDogs.root);
  });

  it('buyer (dogs:create без полного dogs) видит только «Мои собаки»', () => {
    const links = getMyObjectLinks(canFor(['dogs:view', 'dogs:create', 'kennels:view']));
    expect(links.map((l) => l.key)).toEqual(['dogs']);
  });

  it('view-only права не дают ссылок', () => {
    expect(getMyObjectLinks(canFor(['kennels:view', 'dogs:view']))).toEqual([]);
  });
});
```

(import `canPerm` поставить к остальным импортам в начале файла; eslint-плагин perfectionist сам отсортирует через `npx eslint --fix`.)

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/layouts/account/account-nav.test.ts`
Expected: FAIL — href у dogs пока `paths.dashboard.dogs.root`, buyer-кейс пуст.

- [ ] **Step 4: Write minimal implementation**

В `src/layouts/account/account-nav.ts` заменить блок `MY_OBJECTS` (вместе с комментарием над ним):

```ts
// «Мои объекты»: kennels/litters — только владельцам (полное право на ресурс);
// dogs — каждой роли (dogs:create есть у всех, владение — по Dog.owner_id),
// и ведёт в личный раздел «Мои собаки», а не в общий список.
const MY_OBJECTS: { key: MyObjectKey; href: string; perm: string }[] = [
  { key: 'kennels', href: paths.dashboard.kennels.root, perm: 'kennels' },
  { key: 'dogs', href: paths.dashboard.myDogs.root, perm: 'dogs:create' },
  { key: 'litters', href: paths.dashboard.litters.root, perm: 'litters' },
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/layouts/account/account-nav.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/routes/paths.ts src/layouts/account/account-nav.ts src/layouts/account/account-nav.test.ts
git commit -m "feat(my-dogs): /dashboard/my-dogs path + drawer item for all roles

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Ownership-aware кнопки в списке и детали собаки

**Files:**
- Modify: `src/sections/dog/dog-table-row.tsx`
- Modify: `src/sections/dog/view/dog-list-view.tsx`
- Modify: `src/sections/dog/view/dog-detail-view.tsx`

- [ ] **Step 1: Проп `canEdit` в `DogTableRow`**

В `src/sections/dog/dog-table-row.tsx`:

```ts
type Props = {
  row: IDogItem;
  breedName?: string;
  detailsHref: string;
  editHref: string;
  canEdit: boolean;
};

export function DogTableRow({ row, breedName, detailsHref, editHref, canEdit }: Props) {
```

и пункт меню «Редактировать» обернуть в условие:

```tsx
          {canEdit && (
            <li>
              <MenuItem component={RouterLink} href={editHref} onClick={menuActions.onClose}>
                <Iconify icon="solar:pen-bold" />
                {t('common:actions.edit')}
              </MenuItem>
            </li>
          )}
```

- [ ] **Step 2: Список передаёт `canEdit`**

В `src/sections/dog/view/dog-list-view.tsx` добавить импорты:

```ts
import { useAuthContext } from 'src/auth/hooks';
import { usePermissions } from 'src/hooks/use-permissions';

import { canManageDog } from '../dog-utils';
```

в начале компонента (рядом с `useTranslate`):

```ts
  const { user } = useAuthContext();
  const { can } = usePermissions();
```

и в рендере строк:

```tsx
                  <DogTableRow
                    key={row.id}
                    row={row}
                    breedName={breeds.find((breed) => breed.id === row.breed_id)?.name}
                    detailsHref={paths.dashboard.dogs.details(row.id)}
                    editHref={paths.dashboard.dogs.edit(row.id)}
                    canEdit={canManageDog(row, user?.id, can)}
                  />
```

Также кнопку «Добавить собаку» в `CustomBreadcrumbs` НЕ трогаем — страница списка под `dogs:view`, а `dogs:create` теперь у всех ролей, у которых есть `dogs:view`.

- [ ] **Step 3: Деталь показывает «Редактировать» только владельцу/праву**

В `src/sections/dog/view/dog-detail-view.tsx` добавить те же импорты (`useAuthContext`, `usePermissions`, `canManageDog` — последний дописать в существующий импорт из `'../dog-utils'`), в начало компонента:

```ts
  const { user } = useAuthContext();
  const { can } = usePermissions();
```

(до ранних `return` — порядок хуков), и `action` брейдкрамба сделать условным:

```tsx
        action={
          canManageDog(dog, user?.id, can) ? (
            <Button
              component={RouterLink}
              href={paths.dashboard.dogs.edit(dog.id)}
              variant="contained"
              startIcon={<Iconify icon="solar:pen-bold" />}
            >
              {t('detail.edit')}
            </Button>
          ) : undefined
        }
```

- [ ] **Step 4: Gates**

Run: `npx tsc --noEmit` → 0 ошибок; `npx eslint --fix src/sections/dog/dog-table-row.tsx src/sections/dog/view/dog-list-view.tsx src/sections/dog/view/dog-detail-view.tsx` → 0; `npx vitest run` → зелёно.

- [ ] **Step 5: Commit**

```bash
git add src/sections/dog/dog-table-row.tsx src/sections/dog/view/dog-list-view.tsx src/sections/dog/view/dog-detail-view.tsx
git commit -m "feat(dogs): ownership-aware edit buttons in list and detail

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Edit-страница — проверка владения во вьюхе вместо статического гарда

**Files:**
- Modify: `src/app/dashboard/dogs/[id]/edit/page.tsx`
- Modify: `src/sections/dog/view/dog-edit-view.tsx`
- Modify: `src/locales/langs/ru/dog.json`, `src/locales/langs/en/dog.json` (ключ `detail.noAccess`)

- [ ] **Step 1: i18n-ключ**

В `src/locales/langs/ru/dog.json` в объект `detail` добавить:

```json
    "noAccess": "Нет доступа к редактированию этой собаки."
```

В `src/locales/langs/en/dog.json` в `detail`:

```json
    "noAccess": "You don't have access to edit this dog."
```

- [ ] **Step 2: Снять статический гард с роута**

`src/app/dashboard/dogs/[id]/edit/page.tsx` целиком:

```tsx
import { CONFIG } from 'src/global-config';

import { DogEditView } from 'src/sections/dog/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit dog | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

// Доступ ownership-aware (Dog.owner_id) — решает вьюха после загрузки собаки:
// статический PermissionGuard владельца не знает, а dogs:view нет у operator.
// Auth обеспечивает AuthGuard дашборд-layout'а.
export default async function Page({ params }: Props) {
  const { id } = await params;
  return <DogEditView id={id} />;
}
```

- [ ] **Step 3: Проверка владения во вьюхе**

В `src/sections/dog/view/dog-edit-view.tsx` добавить импорты:

```ts
import { EmptyContent } from 'src/components/empty-content';
import { useAuthContext } from 'src/auth/hooks';
import { usePermissions } from 'src/hooks/use-permissions';

import { canManageDog } from '../dog-utils';
```

в компоненте после `useGetDog`:

```ts
  const { user } = useAuthContext();
  const { can } = usePermissions();
```

и после проверки `if (!dog) ...` добавить:

```tsx
  // Зеркало бэкендовских прав: владелец по owner_id ИЛИ dogs:edit (breeder/admin).
  if (!canManageDog(dog, user?.id, can)) {
    return (
      <DashboardContent>
        <EmptyContent filled title={t('detail.noAccess')} sx={{ py: 10 }} />
      </DashboardContent>
    );
  }
```

- [ ] **Step 4: Gates**

Run: `npx tsc --noEmit`; `npx eslint --fix src/app/dashboard/dogs/[id]/edit/page.tsx src/sections/dog/view/dog-edit-view.tsx`; `npx vitest run`.
Expected: всё зелёно.

- [ ] **Step 5: Commit**

```bash
git add "src/app/dashboard/dogs/[id]/edit/page.tsx" src/sections/dog/view/dog-edit-view.tsx src/locales/langs/ru/dog.json src/locales/langs/en/dog.json
git commit -m "feat(dogs): ownership check in edit view replaces static dogs:edit guard

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Пагинация в `useGetMyDogs`

**Files:**
- Modify: `src/actions/dog.ts:62-80`

- [ ] **Step 1: Расширить хук**

Заменить `useGetMyDogs` в `src/actions/dog.ts`:

```ts
/** Собаки текущего пользователя (owner_id == me). Требует авторизации. */
export function useGetMyDogs(query: { page?: number; per_page?: number } = {}) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined)
  );
  const key: [string, { params: Record<string, unknown> }] = [endpoints.auth.myDogs, { params }];

  const { data, isLoading, error, isValidating } = useSWR<IDogPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      dogs: data?.items ?? [],
      dogsTotal: data?.total ?? 0,
      dogsLoading: isLoading,
      dogsError: error,
      dogsEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
    }),
    [data, error, isLoading, isValidating]
  );
}
```

Вызов без аргументов (`show-register-view.tsx`) продолжает работать — поведение бэкенда по умолчанию не меняется (ключ SWR меняется со строки на массив, это безопасно).

- [ ] **Step 2: Gates**

Run: `npx tsc --noEmit`; `npx eslint --fix src/actions/dog.ts`; `npx vitest run`.
Expected: зелёно.

- [ ] **Step 3: Commit**

```bash
git add src/actions/dog.ts
git commit -m "feat(dogs): pagination params in useGetMyDogs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Страница «Мои собаки»

**Files:**
- Modify: `src/locales/langs/ru/dog.json`, `src/locales/langs/en/dog.json` (секция `myDogs`)
- Create: `src/sections/dog/view/my-dogs-view.tsx`
- Modify: `src/sections/dog/view/index.ts`
- Create: `src/app/dashboard/my-dogs/page.tsx`

- [ ] **Step 1: i18n**

В `src/locales/langs/ru/dog.json` (на верхнем уровне, после `list`):

```json
  "myDogs": {
    "title": "Мои собаки",
    "empty": "У вас пока нет собак",
    "add": "Добавить собаку"
  },
```

В `src/locales/langs/en/dog.json` там же:

```json
  "myDogs": {
    "title": "My dogs",
    "empty": "You don't have any dogs yet",
    "add": "Add dog"
  },
```

- [ ] **Step 2: Вьюха**

Create `src/sections/dog/view/my-dogs-view.tsx`:

```tsx
'use client';

import type { TableHeadCellProps } from 'src/components/table';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { useGetMyDogs } from 'src/actions/dog';
import { useGetBreeds } from 'src/actions/reference';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';
import { usePermissions } from 'src/hooks/use-permissions';

import { canManageDog } from '../dog-utils';
import { DogTableRow } from '../dog-table-row';

// ----------------------------------------------------------------------

export function MyDogsView() {
  const { t } = useTranslate(['dog', 'common']);

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'name', label: t('list.columns.name') },
    { id: 'breed', label: t('list.columns.breed'), width: 200 },
    { id: 'sex', label: t('list.columns.sex'), width: 120 },
    { id: 'rkf_number', label: t('list.columns.rkfNumber'), width: 160 },
    { id: 'date_of_birth', label: t('list.columns.born'), width: 140 },
    { id: 'color', label: t('list.columns.color'), width: 160 },
    { id: '', width: 88 },
  ];

  const { user } = useAuthContext();
  const { can } = usePermissions();

  const table = useTable({ defaultRowsPerPage: 25 });
  const { breeds } = useGetBreeds();

  const { dogs, dogsTotal, dogsLoading, dogsEmpty } = useGetMyDogs({
    page: table.page + 1, // backend is 1-based
    per_page: table.rowsPerPage,
  });

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('myDogs.title')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('myDogs.title') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.dogs.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('myDogs.add')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {dogsEmpty ? (
        <EmptyContent filled title={t('myDogs.empty')} sx={{ py: 10 }} />
      ) : (
        <Card>
          <Box sx={{ position: 'relative' }}>
            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom headCells={TABLE_HEAD} rowCount={dogs.length} />

                <TableBody>
                  {dogs.map((row) => (
                    <DogTableRow
                      key={row.id}
                      row={row}
                      breedName={breeds.find((breed) => breed.id === row.breed_id)?.name}
                      detailsHref={paths.dashboard.dogs.details(row.id)}
                      editHref={paths.dashboard.dogs.edit(row.id)}
                      // Свои собаки редактируемы по определению; хелпер — на
                      // случай легаси-строк с owner_id=null.
                      canEdit={canManageDog(row, user?.id, can)}
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
      )}
    </DashboardContent>
  );
}
```

- [ ] **Step 3: Экспорт и роут**

В `src/sections/dog/view/index.ts` добавить строку:

```ts
export * from './my-dogs-view';
```

Create `src/app/dashboard/my-dogs/page.tsx`:

```tsx
import { CONFIG } from 'src/global-config';

import { MyDogsView } from 'src/sections/dog/view';

// ----------------------------------------------------------------------

export const metadata = { title: `My dogs | Dashboard - ${CONFIG.appName}` };

// Личный раздел: PermissionGuard не нужен (у operator нет dogs:view, но свои
// собаки видит каждый). Auth обеспечивает AuthGuard дашборд-layout'а.
export default function Page() {
  return <MyDogsView />;
}
```

- [ ] **Step 4: Gates**

Run: `npx tsc --noEmit`; `npx eslint --fix src/sections/dog/view/my-dogs-view.tsx src/sections/dog/view/index.ts src/app/dashboard/my-dogs/page.tsx`; `npx vitest run`.
Expected: зелёно. (eslint perfectionist пересортирует импорты — это норма.)

- [ ] **Step 5: Commit**

```bash
git add src/sections/dog/view/my-dogs-view.tsx src/sections/dog/view/index.ts src/app/dashboard/my-dogs/page.tsx src/locales/langs/ru/dog.json src/locales/langs/en/dog.json
git commit -m "feat(my-dogs): personal My Dogs page on GET /users/me/dogs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Финальная верификация

- [ ] **Step 1: Полные гейты**

Run: `npx tsc --noEmit` → 0; `npm run lint` → 0; `npx vitest run` → всё зелёно.

- [ ] **Step 2: Рантайм-смоук (если `:8000/health/` отвечает 200 и фронт запущен)**

Демо-сид бэкенда (`scripts/seed_demo.py`, пароль `TestPass123!`) даёт пользователей разных ролей:
1. Под buyer: drawer → «Мои собаки» → страница открывается; «Добавить собаку» → форма создания доступна; созданная собака появляется в «Моих собаках»; её деталь показывает «Редактировать», edit-форма открывается и сохраняет.
2. Под buyer: деталь чужой собаки — кнопки «Редактировать» нет; прямой URL `/dashboard/dogs/<чужой id>/edit` → «Нет доступа…».
3. Под breeder: общий список собак — «Редактировать» в меню строк есть (право `dogs:edit`).

- [ ] **Step 3: Если что-то красное — чинить до зелёного, не коммитить сломанное.**
