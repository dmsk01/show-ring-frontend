import { test as setup, expect } from '@playwright/test';

// ----------------------------------------------------------------------

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

  await page.goto('/auth/jwt/sign-in');
  // Локаль-независимые селекторы: дефолтный язык — RU, поэтому таргетим поля по
  // атрибуту name и сабмит по type, а не по видимым (переводимым) подписям.
  await page.locator('input[name="email"]').fill('admin@admin.com');
  await page.locator('input[name="password"]').fill('Password123!');
  await page.locator('button[type="submit"]').click();

  // GuestGuard redirects authenticated users out of /auth into the dashboard.
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 30_000 });

  // Token is persisted to localStorage by the JWT auth context.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('jwt_access_token')), { timeout: 15_000 })
    .not.toBeNull();

  await page.context().storageState({ path: AUTH_FILE });
});
