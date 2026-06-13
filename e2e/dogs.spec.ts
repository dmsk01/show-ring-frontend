import { test, expect, request as apiRequest } from '@playwright/test';

import { t } from './i18n';

// ----------------------------------------------------------------------
// Dogs CRUD + ownership-гейт. Создание/правка под владельцем (breeder), затем
// проверка, что НЕ-владелец без dogs:edit (buyer) видит "нет доступа" на правке.
// Маршрут /dashboard/dogs/{id}/edit без PermissionGuard — доступ решает вьюха
// по canManageDog (owner_id ИЛИ dogs:edit), поэтому ждём detail.noAccess, не /403.
// Сессии — из per-role storageState; чистка — через API.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const BREEDER = 'e2e/.auth/breeder.json';
const BUYER = 'e2e/.auth/buyer.json';
const stamp = Date.now();
const dogName = `E2E Dog CRUD ${stamp}`;

let dogId = '';

test.describe.serial('Dogs — owner can create & edit (breeder)', () => {
  test.use({ storageState: BREEDER });

  test('create a dog', async ({ page }) => {
    await page.goto('/dashboard/dogs/new');

    await page.getByLabel(t('dog', 'form.fields.name')).fill(dogName);
    await page.getByRole('combobox', { name: t('dog', 'form.fields.breed') }).click();
    await page.getByRole('option').filter({ hasNotText: '—' }).first().click();

    const dob = page.getByRole('group', { name: t('dog', 'form.fields.dateOfBirth') });
    await dob.click();
    await dob.pressSequentially('01012022');

    const createResp = page.waitForResponse(
      (r) => /\/api\/dogs\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: t('dog', 'form.submitCreate') }).click();

    const resp = await createResp;
    expect(resp.ok()).toBeTruthy();
    dogId = (await resp.json()).id;
    expect(dogId).toBeTruthy();
  });

  test('owner edits the dog', async ({ page }) => {
    await page.goto(`/dashboard/dogs/${dogId}/edit`);

    const color = page.getByLabel(t('dog', 'form.fields.color'));
    await expect(color).toBeVisible();
    await color.fill('E2E-Black');
    await page.getByRole('button', { name: t('dog', 'form.submitUpdate') }).click();

    await expect(page.getByText(t('dog', 'toast.updated'))).toBeVisible();
  });
});

test.describe('Dogs — non-owner cannot edit (buyer)', () => {
  test.use({ storageState: BUYER });

  test('buyer gets no-access on a dog they do not own', async ({ page }) => {
    test.skip(!dogId, 'depends on the dog created in the breeder describe');

    await page.goto(`/dashboard/dogs/${dogId}/edit`);
    await expect(page.getByText(t('dog', 'detail.noAccess'))).toBeVisible();
    // Поля правки не отрисованы — это именно «нет доступа», а не пустая форма.
    await expect(page.getByLabel(t('dog', 'form.fields.color'))).toHaveCount(0);
  });
});

test.afterAll(async () => {
  if (!dogId) return;
  const ctx = await apiRequest.newContext({ storageState: BREEDER });
  try {
    await ctx.delete(`${BASE_URL}/api/dogs/${dogId}`);
  } catch {
    // ignore cleanup errors
  } finally {
    await ctx.dispose();
  }
});
