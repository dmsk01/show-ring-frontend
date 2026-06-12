import { test, expect, request as apiRequest } from '@playwright/test';

import { t } from './i18n';

// ----------------------------------------------------------------------
// Критический путь конечного пользователя — «оформление»: запись собаки на
// выставку и управление записью. Покрытия не было вовсе.
//
// Предусловия (собака + открытая к регистрации выставка) создаём через UI с
// живыми дропдаунами (ранг/порода грузятся с бэкенда — не хардкодим id). Чистку
// делаем через API. Серийный сценарий: создать собаку → создать выставку →
// открыть регистрацию → записать → увидеть в «Мои выставки» → изменить → отменить.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const AUTH_FILE = 'e2e/.auth/admin.json';
const stamp = Date.now();
const dogName = `E2E Dog ${stamp}`;
const showName = `E2E Reg Show ${stamp}`;
const showCity = `E2E-Reg-${stamp}`;
const noDash = { hasNotText: '—' };

let dogId = '';
let showId = '';

test.describe.serial('Show entry — register a dog and manage the entry', () => {
  test('seed: create a dog (prerequisite for entry)', async ({ page }) => {
    await page.goto('/dashboard/dogs/new');

    await page.getByLabel(t('dog', 'form.fields.name')).fill(dogName);

    // Порода — MUI Select; первая опция «—». Берём первую реальную породу.
    await page.getByRole('combobox', { name: t('dog', 'form.fields.breed') }).click();
    await page.getByRole('option').filter(noDash).first().click();

    // Дата рождения определяет доступные классы по возрасту — задаём взрослую
    // собаку (формат поля DD.MM.YYYY; секции сами разделяются при вводе цифр).
    // MUI X DatePicker — это role="group" из секций (не один input), поэтому
    // таргетим группу и печатаем цифры; секции (DD.MM.YYYY) разделяются сами.
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

  test('seed: create a show and open registration', async ({ page }) => {
    await page.goto('/dashboard/shows/new');

    await page.getByLabel(t('show', 'form.fields.name')).fill(showName);
    await page.getByRole('combobox', { name: t('show', 'form.fields.rank') }).click();
    await page.getByRole('option').filter(noDash).first().click();
    await page.getByLabel(t('show', 'form.fields.dateStart')).fill('2026-12-01');
    await page.getByLabel(t('show', 'form.fields.city')).fill(showCity);

    const createResp = page.waitForResponse(
      (r) => /\/api\/shows\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: t('show', 'form.submitCreate') }).click();

    const resp = await createResp;
    expect(resp.ok()).toBeTruthy();
    showId = (await resp.json()).id;
    expect(showId).toBeTruthy();
    await page.waitForURL('**/dashboard/shows');

    // Открываем регистрацию (запись разрешена только при status=registration_open).
    await page.goto(`/dashboard/shows/${showId}/edit`);
    await page.getByRole('combobox', { name: t('show', 'form.fields.status') }).click();
    await page
      .getByRole('option', { name: t('show', 'enums.status.registration_open'), exact: true })
      .click();
    await expect(page.getByText(t('show', 'toast.statusUpdated'))).toBeVisible();
  });

  test('register the dog for the show', async ({ page }) => {
    await page.goto(`/shows/${showId}/register`);

    // Выбор собаки.
    await page.getByRole('combobox', { name: t('show', 'register.fields.dog') }).click();
    await page.getByRole('option', { name: dogName }).click();

    // Классы подгружаются по возрасту собаки — селект включается, когда они есть.
    const classSelect = page.getByRole('combobox', { name: t('show', 'register.fields.class') });
    await expect(classSelect).toBeEnabled({ timeout: 15_000 });
    await classSelect.click();
    await page.getByRole('option').filter(noDash).first().click();

    await page.getByRole('button', { name: t('show', 'register.submit') }).click();
    await expect(page.getByText(t('show', 'register.toast.success'))).toBeVisible();
  });

  test('entry appears in My Shows detail', async ({ page }) => {
    await page.goto(`/dashboard/my-shows/${showId}`);
    await expect(page.getByText(dogName)).toBeVisible();
  });

  test('edit the entry (change notes)', async ({ page }) => {
    await page.goto(`/dashboard/my-shows/${showId}`);

    await page.getByRole('button', { name: t('show', 'myShows.editDialog.title') }).click();
    await page
      .getByLabel(t('show', 'myShows.editDialog.fields.notes'))
      .fill(`note-${stamp}`);
    await page.getByRole('button', { name: t('show', 'myShows.editDialog.submit') }).click();

    await expect(page.getByText(t('show', 'myShows.toast.updated'))).toBeVisible();
  });

  test('cancel (delete) the entry', async ({ page }) => {
    await page.goto(`/dashboard/my-shows/${showId}`);

    await page.getByRole('button', { name: t('show', 'myShows.delete.title') }).click();
    // Кнопка подтверждения в ConfirmDialog.
    await page.getByRole('button', { name: t('show', 'myShows.delete.confirm'), exact: true }).click();

    await expect(page.getByText(t('show', 'myShows.toast.deleted'))).toBeVisible();
    await expect(page.getByText(t('show', 'myShows.detail.empty'))).toBeVisible();
  });

  test.afterAll(async () => {
    // Soft cleanup: удаляем созданные сущности через API с сохранённой сессией.
    const ctx = await apiRequest.newContext({ storageState: AUTH_FILE });
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
