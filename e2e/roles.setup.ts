import fs from 'node:fs';

import { test as setup, request } from '@playwright/test';

import { E2E_USERS, apiLogin } from './users';

// ----------------------------------------------------------------------
// Логинимся под каждую сид-роль ОДИН раз и сохраняем storageState — спеки потом
// переиспользуют сессию (test.use({ storageState })).
//
// Логин — через API (cookie-режим, без загрузки страницы входа). Бэкенд
// РЕЙТ-ЛИМИТИТ /auth/login (429, Retry-After ≈32с, порог ~5/окно), а прогону
// нужно ~7 сессий — apiLogin ретраит на 429 (см. users.ts).
//
// Чтобы локальные перезапуски не долбили лимит, ПЕРЕИСПОЛЬЗУЕМ существующий
// storageState — но ТОЛЬКО если он реально валиден (проверяем GET /users/me).
// Так мы не зависим от времени жизни access-токена и не наступаем на грабли
// «протухшая сессия не лечится refresh'ом» (нужен COOKIE_PATH_PREFIX=/api на
// бэке — см. cookie-auth-migration). CI стартует с чистого репо (.auth в
// .gitignore) → всегда логинится заново. Принудительный свежий логин:
// E2E_FRESH_LOGIN=1.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';

/** Сессия из файла ещё жива? Сырой запрос (без браузерного refresh) — если
 *  access-токен протух, /users/me отдаст 401 → перелогиниваемся. */
async function sessionValid(file: string): Promise<boolean> {
  if (process.env.E2E_FRESH_LOGIN) return false;
  if (!fs.existsSync(file)) return false;
  const ctx = await request.newContext({ storageState: file, baseURL: BASE_URL });
  try {
    return (await ctx.get('/api/users/me')).ok();
  } catch {
    return false;
  } finally {
    await ctx.dispose();
  }
}

for (const [role, email] of Object.entries(E2E_USERS)) {
  setup(`authenticate as ${role}`, async ({ context }) => {
    const file = `e2e/.auth/${role}.json`;
    if (await sessionValid(file)) return; // валидную сессию переиспользуем — без логина

    // Запас на 429-ретраи с Retry-After (~32с) при насыщении рейт-лимита.
    setup.setTimeout(180_000);
    await apiLogin(context, email, BASE_URL);
    await context.storageState({ path: file });
  });
}
