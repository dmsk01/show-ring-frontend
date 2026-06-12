import { test as setup, expect } from '@playwright/test';

import { pinLocale } from './i18n';

// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const AUTH_FILE = 'e2e/.auth/admin.json';
const BACKEND_HEALTH = process.env.E2E_BACKEND_HEALTH ?? 'http://localhost:8000/health/';

setup('authenticate as admin', async ({ page, request }) => {
  // Fail fast, with a clear message, if the backend is not up.
  const health = await request.get(BACKEND_HEALTH).catch(() => null);
  if (!health || !health.ok()) {
    throw new Error(
      `Backend not reachable at ${BACKEND_HEALTH}. Start ShowTail (:8000) before running e2e.`
    );
  }

  // Пиним язык RU ДО первой навигации — кука уедет в storageState и закрепит
  // локаль для всех спеков, переиспользующих эту сессию.
  await pinLocale(page.context(), BASE_URL);

  await page.goto('/auth/jwt/sign-in');
  // Локаль-независимые селекторы: дефолтный язык — RU, поэтому таргетим поля по
  // атрибуту name и сабмит по type, а не по видимым (переводимым) подписям.
  await page.locator('input[name="email"]').fill('admin@admin.com');
  await page.locator('input[name="password"]').fill('Password123!');
  await page.locator('button[type="submit"]').click();

  // GuestGuard redirects authenticated users out of /auth into the dashboard.
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 30_000 });

  // Cookie-режим: бэкенд кладёт сессию в httpOnly-куки (JS их не видит, но
  // Playwright читает их из контекста). Ждём появления access_token-куки.
  await expect
    .poll(
      async () => (await page.context().cookies()).some((c) => c.name === 'access_token'),
      { timeout: 15_000 }
    )
    .toBe(true);

  await page.context().storageState({ path: AUTH_FILE });
});
