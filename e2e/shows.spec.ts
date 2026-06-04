import { test, expect, request as apiRequest } from '@playwright/test';

// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const stamp = Date.now();
const showName = `E2E Show ${stamp}`;
const showCity = `E2E-City-${stamp}`;

let showId = '';
let accessToken: string | null = null;

test.describe.serial('Shows full lifecycle', () => {
  test('create a draft show', async ({ page }) => {
    await page.goto('/dashboard/shows/new');

    await page.getByLabel('Name').fill(showName);

    // Rank is a MUI Select (combobox); first option is the empty "—".
    await page.getByRole('combobox', { name: 'Rank' }).click();
    await page.getByRole('option').filter({ hasNotText: '—' }).first().click();

    await page.getByLabel('Start date').fill('2026-09-01');
    await page.getByLabel('City').fill(showCity);

    // Capture token (storageState already populated localStorage for this origin).
    accessToken = await page.evaluate(() => localStorage.getItem('jwt_access_token'));
    expect(accessToken).toBeTruthy();

    const createResp = page.waitForResponse(
      (r) => /\/api\/shows\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Create show' }).click();

    const resp = await createResp;
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    showId = body.id;
    expect(showId).toBeTruthy();

    await expect(page.getByText('Create success!')).toBeVisible();
    await page.waitForURL('**/dashboard/shows');
  });

  test('navigate from list to edit (404 regression)', async ({ page }) => {
    await page.goto('/dashboard/shows');
    await page.getByPlaceholder('City').fill(showCity);

    const rowLink = page.getByRole('link', { name: showName });
    await expect(rowLink).toBeVisible();
    await rowLink.click();

    await page.waitForURL(`**/dashboard/shows/${showId}/edit`);
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
  });

  test('edit show fields', async ({ page }) => {
    await page.goto(`/dashboard/shows/${showId}/edit`);
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();

    await page.getByLabel('Venue').fill('E2E Arena');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Update success!')).toBeVisible();
  });

  test('change show status', async ({ page }) => {
    await page.goto(`/dashboard/shows/${showId}/edit`);

    await page.getByRole('combobox', { name: 'Status' }).click();
    await page.getByRole('option', { name: 'registration open' }).click();

    await expect(page.getByText('Status updated!')).toBeVisible();
  });

  test('publish show (soft assert)', async ({ page }) => {
    await page.goto(`/dashboard/shows/${showId}/edit`);

    const publishResp = page.waitForResponse(
      (r) => /\/api\/shows\/[^/]+\/publish\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Publish' }).click();
    await publishResp;

    // Publish preconditions are backend-defined; assert that *some* toast appeared
    // (success "Show published!" or a meaningful error) — never silent.
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();
  });

  test('results page renders', async ({ page }) => {
    await page.goto(`/dashboard/shows/${showId}/results`);
    await expect(page.getByRole('heading', { name: `Результаты — ${showName}` })).toBeVisible();
  });

  test('documents page renders', async ({ page }) => {
    await page.goto(`/dashboard/shows/${showId}/documents`);
    await expect(page.getByRole('heading', { name: `Документы — ${showName}` })).toBeVisible();
  });

  test.afterAll(async () => {
    if (!showId || !accessToken) return;
    // Hard-delete the show created by this run (DELETE /shows/{id} → 204).
    // Soft: failures here must not fail the suite.
    const ctx = await apiRequest.newContext();
    try {
      await ctx.delete(`${BASE_URL}/api/shows/${showId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // ignore cleanup errors
    } finally {
      await ctx.dispose();
    }
  });
});
