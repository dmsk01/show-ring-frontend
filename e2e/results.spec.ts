import { test, expect, request as apiRequest } from '@playwright/test';

import { t } from './i18n';

// ----------------------------------------------------------------------
// Внесение результата на выставке. Сессия — admin (он же ОРГАНИЗАТОР созданной
// выставки).
//
// ВАЖНО (проверено probe'ом по бэкенду): создание результата авторизуется по
// ВЛАДЕЛЬЦУ выставки (`organizer_id` == текущий пользователь) ИЛИ admin. НЕ по
// роли `judge` и НЕ по привязке судьи к рингу: judge и сторонний organizer-юзер
// получают 403 даже при назначенном (class-matched) ринге. Т.е. фронтовое право
// `judge: results:create` бэкенд НЕ соблюдает — оценку вносит организатор. Это
// зафиксированный RBAC-рассинхрон (см. заметку проекту); здесь тестируем рабочий
// путь: организатор выставки ставит оценку.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const ADMIN = 'e2e/.auth/admin.json';
const stamp = Date.now();
const showName = `E2E Results Show ${stamp}`;
const showCity = `E2E-Res-${stamp}`;
const dogName = `E2E Results Dog ${stamp}`;
const noDash = { hasNotText: '—' };

let showId = '';
let dogId = '';

test.describe.serial('Show results entry (organizer)', () => {
  test('seed: create a dog', async ({ page }) => {
    await page.goto('/dashboard/dogs/new');
    await page.getByLabel(t('dog', 'form.fields.name')).fill(dogName);
    await page.getByRole('combobox', { name: t('dog', 'form.fields.breed') }).click();
    await page.getByRole('option').filter(noDash).first().click();
    const dob = page.getByRole('group', { name: t('dog', 'form.fields.dateOfBirth') });
    await dob.click();
    await dob.pressSequentially('01012022');

    const resp = page.waitForResponse(
      (r) => /\/api\/dogs\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: t('dog', 'form.submitCreate') }).click();
    const r = await resp;
    expect(r.ok()).toBeTruthy();
    dogId = (await r.json()).id;
    expect(dogId).toBeTruthy();
  });

  test('seed: show + entry + set in progress', async ({ page }) => {
    // Длинный сценарий + прогрев тяжёлого роута результатов в конце.
    test.setTimeout(180_000);

    await page.goto('/dashboard/shows/new');
    await page.getByLabel(t('show', 'form.fields.name')).fill(showName);
    await page.getByRole('combobox', { name: t('show', 'form.fields.rank') }).click();
    await page.getByRole('option').filter(noDash).first().click();
    await page.getByLabel(t('show', 'form.fields.dateStart')).fill('2026-12-01');
    await page.getByLabel(t('show', 'form.fields.city')).fill(showCity);

    const resp = page.waitForResponse(
      (r) => /\/api\/shows\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: t('show', 'form.submitCreate') }).click();
    const r = await resp;
    expect(r.ok()).toBeTruthy();
    showId = (await r.json()).id;
    expect(showId).toBeTruthy();
    await page.waitForURL('**/dashboard/shows');

    // Открыть регистрацию (ждём ответ PUT …/status, не транзиентный тост).
    await page.goto(`/dashboard/shows/${showId}/edit`);
    const openResp = page.waitForResponse(
      (r2) => /\/api\/shows\/[^/]+\/status\/?$/.test(r2.url()) && r2.request().method() === 'PUT'
    );
    await page.getByRole('combobox', { name: t('show', 'form.fields.status') }).click();
    await page
      .getByRole('option', { name: t('show', 'enums.status.registration_open'), exact: true })
      .click();
    expect((await openResp).ok()).toBeTruthy();

    // Записать собаку.
    await page.goto(`/shows/${showId}/register`);
    await page.getByRole('combobox', { name: t('show', 'register.fields.dog') }).click();
    await page.getByRole('option', { name: dogName }).click();
    const classSelect = page.getByRole('combobox', { name: t('show', 'register.fields.class') });
    await expect(classSelect).toBeEnabled({ timeout: 15_000 });
    await classSelect.click();
    await page.getByRole('option').filter(noDash).first().click();
    await page.getByRole('button', { name: t('show', 'register.submit') }).click();
    await expect(page.getByText(t('show', 'register.toast.success'))).toBeVisible();

    // Перевести в in_progress (судейство) — только через registration_closed
    // (прямой переход registration_open → in_progress бэкенд отклоняет).
    await page.goto(`/dashboard/shows/${showId}/edit`);
    for (const status of ['registration_closed', 'in_progress'] as const) {
      const statusResp = page.waitForResponse(
        (r2) => /\/api\/shows\/[^/]+\/status\/?$/.test(r2.url()) && r2.request().method() === 'PUT'
      );
      await page.getByRole('combobox', { name: t('show', 'form.fields.status') }).click();
      await page
        .getByRole('option', { name: t('show', `enums.status.${status}`), exact: true })
        .click();
      expect((await statusResp).ok()).toBeTruthy();
    }

    // Прогреваем тяжёлый роут результатов (холодная turbopack-компиляция в dev).
    await page.goto(`/dashboard/shows/${showId}/results`);
    await expect(
      page.getByRole('heading', { name: t('show', 'results.heading', { name: showName }) })
    ).toBeVisible({ timeout: 90_000 });
  });

  test('organizer grades the entry', async ({ page }) => {
    await page.goto(`/dashboard/shows/${showId}/results`);

    // Действие строки «Оценка». Скоупим в tbody: в шапке столбец «Оценка» — тоже
    // button (сортировка), имя совпадает → strict-mode коллизия.
    const tbody = page.locator('tbody');
    const gradeBtn = tbody.getByRole('button', { name: t('show', 'results.actions.grade') });
    await expect(gradeBtn).toBeVisible({ timeout: 30_000 });
    await gradeBtn.click();

    // Реальная оценка «Отлично» (первая опция — «Отсутствует»/absent, не годится).
    await page.getByRole('combobox', { name: t('show', 'resultDialog.fields.grade') }).click();
    await page.getByRole('option', { name: 'Отлично', exact: true }).click();

    // Детерминированный POST …/results вместо транзиентного sonner-тоста.
    const createResp = page.waitForResponse(
      (r) => /\/api\/shows\/[^/]+\/results\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: t('common', 'actions.save') }).click();
    const created = await createResp;
    if (!created.ok()) {
      throw new Error(`POST /results -> ${created.status()}: ${await created.text()}`);
    }

    // После сохранения действие в строке становится «Изм.» — UI-подтверждение.
    await expect(
      tbody.getByRole('button', { name: t('show', 'results.actions.edit') })
    ).toBeVisible();
  });

  test.afterAll(async () => {
    const ctx = await apiRequest.newContext({ storageState: ADMIN });
    try {
      if (showId) await ctx.delete(`${BASE_URL}/api/shows/${showId}`);
      if (dogId) await ctx.delete(`${BASE_URL}/api/dogs/${dogId}`);
    } catch {
      // ignore cleanup errors
    } finally {
      await ctx.dispose();
    }
  });
});
