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

test.describe('Auth — sign-up by phone', () => {
  test('registration is phone-only: no email form, code is requested by SMS', async ({ page }) => {
    // Уникальный номер: per-phone cooldown OTP не мешает повторным прогонам.
    const phone = `999${String(Date.now()).slice(-7)}`;

    await page.goto('/auth/jwt/sign-up');

    // Email-регистрации больше нет — только телефон.
    await expect(page.locator('input[name="email"]')).toHaveCount(0);

    await page.getByLabel(t('auth', 'phone.label')).fill(phone);

    const sendResp = page.waitForResponse(
      (r) => /\/api\/auth\/send-code\/?$/.test(r.url()) && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: t('auth', 'phone.sendCode') }).click();
    expect((await sendResp).status()).toBe(200);

    // Шаг ввода кода: кнопка подтверждения и ссылка смены номера.
    await expect(page.getByRole('button', { name: t('auth', 'signUp.submit') })).toBeVisible();
    await expect(page.getByRole('button', { name: t('auth', 'phone.changePhone') })).toBeVisible();
  });
});

test.describe('Auth — sign-in negative', () => {
  test('wrong credentials show an error and keep the user on /auth', async ({ page }) => {
    await page.goto('/auth/jwt/sign-in');

    // Телефон — основной способ; почта открывается ссылкой.
    await page.getByRole('button', { name: t('auth', 'signIn.byEmail') }).click();

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
