import { test, expect, request as apiRequest } from '@playwright/test';

import { t } from './i18n';

// ----------------------------------------------------------------------
// Classifieds — создание объявления. Покрываем регрессию, из-за которой бэкенд
// отдавал 422 `description: String should have at least 10 characters`: фронт
// раньше пускал описание от 1 символа. Теперь схема зеркалит ограничения
// ClassifiedCreate (title 3..255, description ≥10), поэтому слишком короткое
// описание ловится КЛИЕНТСКИ — POST не уходит.
//
// Также проверяем happy-path с ЧИСЛОВОЙ ценой (Field.Text type="number" отдаёт
// number на blur — раньше падало на z.string()).
//
// Создавать объявления может breeder (полное право `classifieds`); остальные —
// только `classifieds:view`, поэтому /new под ними редиректит на /error/403.
// Сессии — из per-role storageState; чистка — через API. Требует сид-юзеров и
// бэкенд :8000.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const BREEDER = 'e2e/.auth/breeder.json';
const BUYER = 'e2e/.auth/buyer.json';
const stamp = Date.now();
const title = `E2E Classified ${stamp}`;

let classifiedId = '';

test.describe.serial('Classifieds — create flow (breeder)', () => {
  test.use({ storageState: BREEDER });

  test('rejects a too-short description client-side (the 10-char rule)', async ({ page }) => {
    await page.goto('/dashboard/classifieds/new');

    await page.getByLabel(t('classified', 'form.fields.title')).fill(title);
    // Ровно тот ввод, что вызывал 422 на бэкенде.
    await page.getByLabel(t('classified', 'form.fields.description')).fill('ccvcvx');

    // Если форма ошибочно отправится — поймаем POST и провалим тест.
    let posted = false;
    page.on('request', (req) => {
      if (/\/api\/classifieds\/?$/.test(req.url()) && req.method() === 'POST') posted = true;
    });

    await page.getByRole('button', { name: t('classified', 'form.submitCreate') }).click();

    // Клиентская валидация показывает ошибку и держит нас на форме — без запроса.
    await expect(page.getByText(t('classified', 'form.validation.descriptionMin'))).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/classifieds\/new/);
    expect(posted).toBeFalsy();
  });

  test('creates a classified with a numeric price', async ({ page }) => {
    await page.goto('/dashboard/classifieds/new');

    await page.getByLabel(t('classified', 'form.fields.title')).fill(title);
    await page
      .getByLabel(t('classified', 'form.fields.description'))
      .fill('E2E listing description — long enough to satisfy the backend.');
    // Числовая цена: blur приводит значение к number — проверяем, что это ок.
    await page.getByLabel(t('classified', 'form.fields.price')).fill('1500');

    const createResp = page.waitForResponse(
      (r) => /\/api\/classifieds\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: t('classified', 'form.submitCreate') }).click();

    const resp = await createResp;
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    classifiedId = body.id;
    expect(classifiedId).toBeTruthy();
    expect(Number(body.price)).toBe(1500);
  });
});

test.describe('Classifieds — RBAC', () => {
  test.use({ storageState: BUYER });

  test('buyer (view-only) cannot open the create form', async ({ page }) => {
    // У buyer только `classifieds:view` — PermissionGuard шлёт на /error/403.
    await page.goto('/dashboard/classifieds/new');
    await expect(page).toHaveURL(/\/error\/403/);
  });
});

test.afterAll(async () => {
  if (!classifiedId) return;
  const ctx = await apiRequest.newContext({ storageState: BREEDER });
  try {
    await ctx.delete(`${BASE_URL}/api/classifieds/${classifiedId}`);
  } catch {
    // ignore cleanup errors
  } finally {
    await ctx.dispose();
  }
});
