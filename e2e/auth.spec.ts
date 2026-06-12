import { test, expect } from '@playwright/test';

import { t, pinLocale } from './i18n';

// ----------------------------------------------------------------------
// Аутентификация — гостевые флоу (без сохранённой админ-сессии).
// Переопределяем storageState на пустой, иначе GuestGuard уведёт авторизованного
// пользователя из /auth в дашборд. Локаль пиним кукой (Accept-Language браузера
// Playwright — en-US, а нам нужен детерминированный RU).
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ context }) => {
  await pinLocale(context, BASE_URL);
});

test.describe('Auth — sign-up', () => {
  test('registration does NOT log in — redirects to sign-in with a notice', async ({ page }) => {
    const email = `e2e+${Date.now()}@example.com`;

    await page.goto('/auth/jwt/sign-up');

    await page.getByLabel(t('auth', 'fields.email')).fill(email);
    await page.getByLabel(t('auth', 'fields.password'), { exact: true }).fill('Password123!');

    const registerResp = page.waitForResponse(
      (r) => /\/api\/auth\/register\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: t('auth', 'signUp.submit') }).click();
    await registerResp;

    // Ведёт на /sign-in (НЕ в дашборд) — бэкенд требует подтверждения email.
    await page.waitForURL('**/auth/jwt/sign-in');
    expect(page.url()).toContain('/auth/jwt/sign-in');

    // Подтверждающий тост (текст бэкенда либо дефолтный «проверьте email»).
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();
  });
});

test.describe('Auth — sign-in negative', () => {
  test('wrong credentials show an error and keep the user on /auth', async ({ page }) => {
    await page.goto('/auth/jwt/sign-in');

    await page.getByLabel(t('auth', 'fields.email')).fill('nobody@example.com');
    await page
      .getByLabel(t('auth', 'fields.password'), { exact: true })
      .fill('definitely-wrong-password');

    await page.getByRole('button', { name: t('auth', 'signIn.submit') }).click();

    // Inline-алерт с ошибкой (см. jwt-sign-in-view) и НЕТ редиректа из /auth.
    await expect(page.getByRole('alert')).toBeVisible();
    expect(page.url()).toContain('/auth/jwt/sign-in');
  });
});
