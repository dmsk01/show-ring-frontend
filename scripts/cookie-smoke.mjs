// Runtime smoke for the httpOnly-cookie auth flow.
// Usage: node scripts/cookie-smoke.mjs  (requires dev server on :8082 + backend on :8000)
//   SMOKE_EMAIL / SMOKE_PASSWORD override credentials.
import { chromium } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const EMAIL = process.env.SMOKE_EMAIL ?? 'admin@admin.com';
const PASSWORD = process.env.SMOKE_PASSWORD ?? 'Password123!';

const log = (...a) => console.log(...a);
const dump = (cookies) =>
  cookies.map((c) => `    ${c.name}  path=${c.path}  httpOnly=${c.httpOnly} sameSite=${c.sameSite} secure=${c.secure}`).join('\n');

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

let loginStatus = null;
page.on('response', (r) => {
  if (r.url().includes('/api/auth/login')) loginStatus = r.status();
});

try {
  log(`\n=== 1) LOGIN as ${EMAIL} ===`);
  await page.goto(`${BASE}/auth/jwt/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').fill(EMAIL);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();

  // Wait for redirect away from /auth OR an error alert.
  let redirected = false;
  try {
    await page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 20_000 });
    redirected = true;
  } catch {
    redirected = false;
  }

  log(`  POST /api/auth/login status: ${loginStatus}`);
  log(`  redirected out of /auth: ${redirected}  (now at ${new URL(page.url()).pathname})`);
  if (!redirected) {
    const alertText = await page.locator('.MuiAlert-message').first().textContent().catch(() => null);
    log(`  error alert: ${alertText ?? '(none)'}`);
  }

  const cookies = await ctx.cookies();
  log(`  cookies after login:\n${dump(cookies) || '    (none)'}`);

  const access = cookies.find((c) => c.name === 'access_token');
  const refresh = cookies.find((c) => c.name === 'refresh_token');
  log(`\n=== 2) COOKIE PATH CHECK (the COOKIE_PATH_PREFIX issue) ===`);
  log(`  access_token  present=${!!access} path=${access?.path ?? '—'}`);
  log(`  refresh_token present=${!!refresh} path=${refresh?.path ?? '—'}`);
  if (refresh) {
    const ok = refresh.path.startsWith('/api/auth');
    log(`  refresh path reaches /api/auth/refresh through proxy: ${ok ? 'YES ✅' : 'NO ❌ (set backend COOKIE_PATH_PREFIX=/api)'}`);
  }

  // 3) Force a refresh: drop access cookie, keep refresh, hit a protected API.
  log(`\n=== 3) FORCED REFRESH (simulate expired access) ===`);
  if (access && refresh) {
    await ctx.clearCookies();
    await ctx.addCookies([{ ...refresh }]); // keep only refresh
    let refreshStatus = null;
    let meStatus = null;
    page.on('response', (r) => {
      if (r.url().includes('/api/auth/refresh')) refreshStatus = r.status();
      if (r.url().includes('/api/users/me')) meStatus = r.status();
    });
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const after = await ctx.cookies();
    const newAccess = after.find((c) => c.name === 'access_token');
    const onAuth = new URL(page.url()).pathname.startsWith('/auth');
    log(`  POST /api/auth/refresh status: ${refreshStatus ?? '(not called)'}`);
    log(`  GET /api/users/me status: ${meStatus ?? '(not observed)'}`);
    log(`  new access_token issued: ${!!newAccess}`);
    log(`  bounced to /auth: ${onAuth}`);
    log(`  REFRESH FLOW: ${newAccess && !onAuth ? 'WORKS ✅' : 'BROKEN ❌'}`);
  } else {
    log('  skipped (no access+refresh cookies to work with)');
  }
} catch (err) {
  log(`\nSMOKE ERROR: ${err.message}`);
} finally {
  await browser.close();
}
