import { test, expect, request as apiRequest } from '@playwright/test';

import { t } from './i18n';

// ----------------------------------------------------------------------
// Жизненный цикл выставки глазами организатора/админа.
// Локаль закреплена в RU (auth.setup пинит куку i18next) — ассертим строки из
// словаря `src/locales/langs/ru/*`, а не хардкодом, чтобы правки переводов не
// ломали тесты по тексту.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const AUTH_FILE = 'e2e/.auth/admin.json';
const stamp = Date.now();
const showName = `E2E Show ${stamp}`;
const showCity = `E2E-City-${stamp}`;

let showId = '';

test.describe.serial('Shows full lifecycle', () => {
  test('create a draft show', async ({ page }) => {
    await page.goto('/dashboard/shows/new');

    await page.getByLabel(t('show', 'form.fields.name')).fill(showName);

    // Rank — MUI Select (combobox); первая опция — пустая «—».
    await page.getByRole('combobox', { name: t('show', 'form.fields.rank') }).click();
    await page.getByRole('option').filter({ hasNotText: '—' }).first().click();

    await page.getByLabel(t('show', 'form.fields.dateStart')).fill('2026-09-01');
    await page.getByLabel(t('show', 'form.fields.city')).fill(showCity);

    const createResp = page.waitForResponse(
      (r) => /\/api\/shows\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: t('show', 'form.submitCreate') }).click();

    const resp = await createResp;
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    showId = body.id;
    expect(showId).toBeTruthy();

    await expect(page.getByText(t('show', 'toast.created'))).toBeVisible();
    await page.waitForURL('**/dashboard/shows');
  });

  test('navigate from list to edit (404 regression)', async ({ page }) => {
    await page.goto('/dashboard/shows');
    await page.getByPlaceholder(t('show', 'list.filters.city')).fill(showCity);

    const rowLink = page.getByRole('link', { name: showName });
    await expect(rowLink).toBeVisible();
    await rowLink.click();

    await page.waitForURL(`**/dashboard/shows/${showId}/edit`);
    await expect(
      page.getByRole('button', { name: t('show', 'form.submitUpdate') })
    ).toBeVisible();
  });

  test('edit show fields', async ({ page }) => {
    await page.goto(`/dashboard/shows/${showId}/edit`);
    await expect(
      page.getByRole('button', { name: t('show', 'form.submitUpdate') })
    ).toBeVisible();

    await page.getByLabel(t('show', 'form.fields.venue')).fill('E2E Arena');
    await page.getByRole('button', { name: t('show', 'form.submitUpdate') }).click();

    await expect(page.getByText(t('show', 'toast.updated'))).toBeVisible();
  });

  test('change show status', async ({ page }) => {
    await page.goto(`/dashboard/shows/${showId}/edit`);

    await page.getByRole('combobox', { name: t('show', 'form.fields.status') }).click();
    await page
      .getByRole('option', { name: t('show', 'enums.status.registration_open'), exact: true })
      .click();

    await expect(page.getByText(t('show', 'toast.statusUpdated'))).toBeVisible();
  });

  test('publish show (soft assert)', async ({ page }) => {
    await page.goto(`/dashboard/shows/${showId}/edit`);

    const publishResp = page.waitForResponse(
      (r) => /\/api\/shows\/[^/]+\/publish\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: t('show', 'form.actions.publish') }).click();
    await publishResp;

    // Предусловия публикации задаёт бэкенд; ассертим, что появился *какой-то*
    // тост (успех «Выставка опубликована!» или осмысленная ошибка) — не молча.
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();
  });

  test('results page renders', async ({ page }) => {
    await page.goto(`/dashboard/shows/${showId}/results`);
    await expect(
      page.getByRole('heading', { name: t('show', 'results.heading', { name: showName }) })
    ).toBeVisible();
  });

  test('documents page renders', async ({ page }) => {
    await page.goto(`/dashboard/shows/${showId}/documents`);
    await expect(
      page.getByRole('heading', { name: t('show', 'documents.heading', { name: showName }) })
    ).toBeVisible();
  });

  test.afterAll(async () => {
    if (!showId) return;
    // Hard-delete the show created by this run (DELETE /shows/{id} → 204).
    // Cookie-режим: поднимаем request-контекст с сохранённой сессией (storageState
    // несёт httpOnly access_token-куку), её и пошлёт DELETE. Soft: ошибки чистки
    // не валят сьют.
    const ctx = await apiRequest.newContext({ storageState: AUTH_FILE });
    try {
      await ctx.delete(`${BASE_URL}/api/shows/${showId}`);
    } catch {
      // ignore cleanup errors
    } finally {
      await ctx.dispose();
    }
  });
});
