import type { Page } from '@playwright/test';

import { test, expect } from '@playwright/test';

import { t } from './i18n';

// ----------------------------------------------------------------------
// RBAC — права по ролям через гарды роутов. PermissionGuard при отказе делает
// router.replace('/error/403'), при доступе рендерит вью. Разделяющие роуты:
//   /dashboard/shows/new   → shows:create
//   /dashboard/kennels/new → kennels:create
//   списки                 → *:view
// Сверяемся с матрицей src/config/permissions.ts (голый `shows` покрывает
// `shows:create`). Сессии берём из per-role storageState (roles.setup.ts) —
// без перелогина в каждом тесте. Требует сид-юзеров и бэкенд :8000.
// ----------------------------------------------------------------------

const SHOWS_NEW = '/dashboard/shows/new';
const KENNELS_NEW = '/dashboard/kennels/new';
const SHOWS_LIST = '/dashboard/shows';
const DOGS_LIST = '/dashboard/dogs';

const roleState = (role: string) => `e2e/.auth/${role}.json`;

async function expectDenied(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page).toHaveURL(/\/error\/403/);
}

async function expectAllowed(page: Page, path: string, heading: string): Promise<void> {
  await page.goto(path);
  // Заголовок вью рендерится только после прохождения гарда — позитивный признак
  // доступа (URL-проверка слаба: до редиректа на /403 он совпадает с целевым).
  await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  await expect(page).not.toHaveURL(/\/error\/403/);
}

test.describe('RBAC — organizer', () => {
  test.use({ storageState: roleState('organizer') });

  test('can create shows, cannot create kennels', async ({ page }) => {
    await expectAllowed(page, SHOWS_NEW, t('show', 'form.headingNew'));
    await expectDenied(page, KENNELS_NEW);
  });
});

test.describe('RBAC — breeder', () => {
  test.use({ storageState: roleState('breeder') });

  test('can create kennels, cannot create shows', async ({ page }) => {
    await expectAllowed(page, KENNELS_NEW, t('kennel', 'form.headingNew'));
    await expectDenied(page, SHOWS_NEW);
  });
});

test.describe('RBAC — judge', () => {
  test.use({ storageState: roleState('judge') });

  test('read-only shows, no create on shows/kennels', async ({ page }) => {
    await expectAllowed(page, SHOWS_LIST, t('show', 'list.title'));
    await expectDenied(page, SHOWS_NEW);
    await expectDenied(page, KENNELS_NEW);
  });
});

test.describe('RBAC — buyer', () => {
  test.use({ storageState: roleState('buyer') });

  test('can browse dogs, cannot create shows', async ({ page }) => {
    await expectAllowed(page, DOGS_LIST, t('dog', 'list.title'));
    await expectDenied(page, SHOWS_NEW);
  });
});

test.describe('RBAC — operator', () => {
  test.use({ storageState: roleState('operator') });

  test('can browse dogs, cannot create shows', async ({ page }) => {
    await expectAllowed(page, DOGS_LIST, t('dog', 'list.title'));
    await expectDenied(page, SHOWS_NEW);
  });
});

test.describe('RBAC — multi-role (breeder + organizer)', () => {
  test.use({ storageState: roleState('multi') });

  test('union grants both create permissions', async ({ page }) => {
    await expectAllowed(page, SHOWS_NEW, t('show', 'form.headingNew'));
    await expectAllowed(page, KENNELS_NEW, t('kennel', 'form.headingNew'));
  });
});
