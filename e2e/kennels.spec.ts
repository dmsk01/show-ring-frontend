import { test, expect, request as apiRequest } from '@playwright/test';

import { t } from './i18n';

// ----------------------------------------------------------------------
// Kennels CRUD под ролью breeder (у неё полный домен `kennels`). Сессия — из
// per-role storageState (roles.setup), без перелогина. Чистка — через API.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const BREEDER = 'e2e/.auth/breeder.json';
const stamp = Date.now();
const kennelName = `E2E Kennel ${stamp}`;

let kennelId = '';

test.describe.serial('Kennels CRUD (breeder)', () => {
  test.use({ storageState: BREEDER });

  test('create a kennel', async ({ page }) => {
    await page.goto('/dashboard/kennels/new');
    await page.getByLabel(t('kennel', 'form.fields.name')).fill(kennelName);

    const createResp = page.waitForResponse(
      (r) => /\/api\/kennels\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: t('kennel', 'form.submitCreate') }).click();

    const resp = await createResp;
    expect(resp.ok()).toBeTruthy();
    kennelId = (await resp.json()).id;
    expect(kennelId).toBeTruthy();

    await expect(page.getByText(t('kennel', 'toast.created'))).toBeVisible();
    await page.waitForURL('**/dashboard/kennels');
  });

  test('edit the kennel', async ({ page }) => {
    await page.goto(`/dashboard/kennels/${kennelId}/edit`);
    await expect(
      page.getByRole('button', { name: t('kennel', 'form.submitUpdate') })
    ).toBeVisible();

    await page.getByLabel(t('kennel', 'form.fields.city')).fill('E2E-Town');
    await page.getByRole('button', { name: t('kennel', 'form.submitUpdate') }).click();

    await expect(page.getByText(t('kennel', 'toast.updated'))).toBeVisible();
  });

  test.afterAll(async () => {
    if (!kennelId) return;
    const ctx = await apiRequest.newContext({ storageState: BREEDER });
    try {
      await ctx.delete(`${BASE_URL}/api/kennels/${kennelId}`);
    } catch {
      // ignore cleanup errors
    } finally {
      await ctx.dispose();
    }
  });
});
