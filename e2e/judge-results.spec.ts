import { test, expect, request as apiRequest } from '@playwright/test';

import { t } from './i18n';

// ----------------------------------------------------------------------
// Внесение результата судьёй. Сидим выставку + собаку + запись под админом
// (проверенный UI-путь из show-entry.spec), переводим в in_progress, затем под
// сессией judge выставляем оценку со страницы результатов (results:create).
// Сессия judge — из per-role storageState; чистка — через API под админом.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const ADMIN = 'e2e/.auth/admin.json';
const JUDGE = 'e2e/.auth/judge.json';
const stamp = Date.now();
const showName = `E2E Judge Show ${stamp}`;
const showCity = `E2E-Judge-${stamp}`;
const dogName = `E2E Judge Dog ${stamp}`;
const noDash = { hasNotText: '—' };

let showId = '';
let dogId = '';

test.describe.serial('seed: show with an entry, in progress (admin)', () => {
  test('create dog', async ({ page }) => {
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

  test('create show + open registration + register dog + set in progress', async ({ page }) => {
    // Сценарий длинный + прогрев тяжёлого роута результатов в конце.
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

    // Открыть регистрацию. Ждём детерминированный ответ PUT …/status, а не
    // транзиентный sonner-тост (он авто-исчезает — флак при длинном сценарии).
    await page.goto(`/dashboard/shows/${showId}/edit`);
    const openResp = page.waitForResponse(
      (r) => /\/api\/shows\/[^/]+\/status\/?$/.test(r.url()) && r.request().method() === 'PUT'
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

    // Перевести в in_progress (судейство). Лайфсайкл бэкенда требует пройти
    // через registration_closed — прямой переход registration_open → in_progress
    // отклоняется (проверено на бэке).
    await page.goto(`/dashboard/shows/${showId}/edit`);
    for (const status of ['registration_closed', 'in_progress'] as const) {
      const statusResp = page.waitForResponse(
        (r) => /\/api\/shows\/[^/]+\/status\/?$/.test(r.url()) && r.request().method() === 'PUT'
      );
      await page.getByRole('combobox', { name: t('show', 'form.fields.status') }).click();
      await page
        .getByRole('option', { name: t('show', `enums.status.${status}`), exact: true })
        .click();
      expect((await statusResp).ok()).toBeTruthy();
    }

    // Прогреваем тяжёлый роут результатов (холодная turbopack-компиляция ~минуту),
    // пока мы под админом, — тогда визит судьи будет «тёплым» и детерминированным.
    await page.goto(`/dashboard/shows/${showId}/results`);
    await expect(
      page.getByRole('heading', { name: t('show', 'results.heading', { name: showName }) })
    ).toBeVisible({ timeout: 90_000 });
  });
});

test.describe('judge grades the entry', () => {
  test.use({ storageState: JUDGE });

  test('grade the entry from the results page', async ({ page }) => {
    test.skip(!showId, 'depends on the seeded show');
    // Страница результатов тяжёлая (холодная компиляция роута + много SWR-джойнов
    // для строк) — даём запас сверх дефолтных 60с.
    test.setTimeout(120_000);

    // Привязываем ожидание к фактическому приходу записей (их GET строит строки),
    // а не к слепому таймауту — роут результатов тяжёлый и холодно компилируется.
    const entriesResp = page.waitForResponse(
      (r) =>
        new RegExp(`/api/shows/${showId}/entries(\\?|/?$)`).test(r.url()) &&
        r.request().method() === 'GET',
      { timeout: 60_000 }
    );
    await page.goto(`/dashboard/shows/${showId}/results`);
    await entriesResp;

    // Действие строки «Оценка» (results:create). Скоупим в tbody: в шапке столбец
    // «Оценка» — тоже button (сортировка), имя совпадает → strict-mode коллизия.
    const tbody = page.locator('tbody');
    const gradeBtn = tbody.getByRole('button', { name: t('show', 'results.actions.grade') });
    await expect(gradeBtn).toBeVisible({ timeout: 30_000 });
    await gradeBtn.click();

    // Диалог результата: выбрать оценку (combobox с лейблом «Оценка»).
    await page.getByRole('combobox', { name: t('show', 'resultDialog.fields.grade') }).click();
    await page.getByRole('option').filter(noDash).first().click();
    await page.getByRole('button', { name: t('common', 'actions.save') }).click();

    await expect(page.getByText(t('show', 'toast.created'))).toBeVisible();
    // После сохранения действие в строке становится «Изм.».
    await expect(
      tbody.getByRole('button', { name: t('show', 'results.actions.edit') })
    ).toBeVisible();
  });
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
