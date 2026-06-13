import fs from 'node:fs';

import { test as setup } from '@playwright/test';

import { E2E_USERS, apiLogin } from './users';

// ----------------------------------------------------------------------
// Логинимся под каждую сид-роль ОДИН раз и сохраняем storageState — спеки потом
// переиспользуют сессию (test.use({ storageState })).
//
// Логин — через API (cookie-режим, без загрузки страницы входа). Бэкенд
// РЕЙТ-ЛИМИТИТ /auth/login (429, Retry-After ≈32с, порог ~5/окно), а прогону
// нужно ~7 сессий — apiLogin ретраит на 429 (см. users.ts).
//
// Чтобы локальные перезапуски не долбили лимит, ПЕРЕИСПОЛЬЗУЕМ свежий
// storageState (≤25 мин): протухший access-token самовосстановится через
// refresh по куке. CI стартует с чистого репо (.auth в .gitignore) → всегда
// логинится заново. Принудительный свежий логин: E2E_FRESH_LOGIN=1.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const FRESH_MS = 25 * 60 * 1000;

function isFresh(file: string): boolean {
  if (process.env.E2E_FRESH_LOGIN) return false;
  try {
    return Date.now() - fs.statSync(file).mtimeMs < FRESH_MS;
  } catch {
    return false;
  }
}

for (const [role, email] of Object.entries(E2E_USERS)) {
  setup(`authenticate as ${role}`, async ({ context }) => {
    const file = `e2e/.auth/${role}.json`;
    if (isFresh(file)) return; // переиспользуем недавнюю сессию — не тратим логин

    // Запас на 429-ретраи с Retry-After (~32с) при насыщении рейт-лимита.
    setup.setTimeout(180_000);
    await apiLogin(context, email, BASE_URL);
    await context.storageState({ path: file });
  });
}
