import { test, expect, request as apiRequest } from '@playwright/test';

import { t } from './i18n';

// ----------------------------------------------------------------------
// Рекламная кампания: организатор создаёт, первый запуск в показ — только
// после модерации администратором (бэкенд: 403 moderation_required, admin
// ставит approved_at). Ревью фронтенда 2026-10-09, FE-30 (и FE-13 — бейдж
// «На модерации»).
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const ORGANIZER = 'e2e/.auth/organizer.json';
const ADMIN = 'e2e/.auth/admin.json';
const stamp = Date.now();
const campaignName = `E2E Campaign ${stamp}`;

let campaignId = '';

const statusResponse =
  (method: string) => (r: { url(): string; request(): { method(): string } }) =>
    /\/api\/ads\/campaigns(\/[^/]+)?\/?$/.test(r.url()) && r.request().method() === method;

async function chooseStatus(page: import('@playwright/test').Page, status: string) {
  await page.getByRole('combobox', { name: t('ad', 'form.fields.status') }).click();
  await page.getByRole('option', { name: t('ad', `enums.status.${status}`), exact: true }).click();
}

test.describe.serial('Ad campaign — create and moderate', () => {
  test('organizer creates a campaign; it awaits moderation', async ({ browser }) => {
    const context = await browser.newContext({ storageState: ORGANIZER });
    const page = await context.newPage();

    await page.goto('/dashboard/ads/new');
    await page.getByLabel(t('ad', 'form.fields.name')).fill(campaignName);
    await page.getByLabel(t('ad', 'form.fields.budget')).fill('1000');
    await page.getByLabel(t('ad', 'form.fields.dateStart')).fill('2026-12-01');
    await page.getByLabel(t('ad', 'form.fields.dateEnd')).fill('2026-12-31');

    const created = page.waitForResponse(statusResponse('POST'));
    await page.getByRole('button', { name: t('ad', 'form.submitCreate') }).click();
    const res = await created;
    expect(res.ok()).toBeTruthy();
    campaignId = (await res.json()).id;

    await page.waitForURL((url) => url.pathname.replace(/\/$/, '') === '/dashboard/ads');
    const row = page.getByRole('row').filter({ hasText: campaignName });
    await expect(row.getByText(t('ad', 'moderation.pending'))).toBeVisible();

    // Сам запустить в показ организатор не может — нужна модерация.
    await page.goto(`/dashboard/ads/${campaignId}/edit`);
    await chooseStatus(page, 'active');
    const rejected = page.waitForResponse(statusResponse('PUT'));
    await page.getByRole('button', { name: t('ad', 'form.submitUpdate') }).click();
    expect((await rejected).status()).toBe(403);
    await expect(page.getByText(t('ad', 'errors.moderationRequired'))).toBeVisible();

    await context.close();
  });

  // FE-37: раньше одобрить чужую кампанию через интерфейс было нельзя —
  // страница правки искала её среди «моих». Теперь — вкладка «Кампании»
  // в модерации.
  test('admin approves the campaign in the moderation queue', async ({ browser }) => {
    const context = await browser.newContext({ storageState: ADMIN });
    const page = await context.newPage();

    await page.goto('/dashboard/admin/moderation');
    await page.getByRole('tab', { name: t('admin', 'moderation.tabs.campaigns') }).click();

    const row = page.getByRole('row').filter({ hasText: campaignName });
    await expect(row).toBeVisible();

    const decided = page.waitForResponse(
      (r) =>
        /\/api\/admin\/moderation\/campaigns\/[^/]+\/?$/.test(r.url()) &&
        r.request().method() === 'PUT'
    );
    await row
      .getByRole('button', { name: t('admin', 'moderation.campaigns.actions.approve') })
      .click();
    const res = await decided;
    expect(res.ok()).toBeTruthy();
    const campaign = await res.json();
    expect(campaign.status).toBe('active');
    expect(campaign.approved_at).toBeTruthy();

    // Одобренная кампания уходит из очереди.
    await expect(row).toHaveCount(0);

    await context.close();
  });

  test('organizer no longer sees the moderation badge', async ({ browser }) => {
    const context = await browser.newContext({ storageState: ORGANIZER });
    const page = await context.newPage();

    await page.goto('/dashboard/ads');
    const row = page.getByRole('row').filter({ hasText: campaignName });
    await expect(row.getByText(t('ad', 'enums.status.active'))).toBeVisible();
    await expect(row.getByText(t('ad', 'moderation.pending'))).toHaveCount(0);

    await context.close();
  });
});

test.afterAll(async () => {
  const ctx = await apiRequest.newContext({ storageState: ADMIN });
  try {
    if (campaignId) await ctx.delete(`${BASE_URL}/api/ads/campaigns/${campaignId}`);
  } catch {
    // ignore cleanup errors
  } finally {
    await ctx.dispose();
  }
});
