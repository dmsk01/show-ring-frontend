import { test as setup } from '@playwright/test';

import { E2E_USERS, apiLogin } from './users';

// ----------------------------------------------------------------------
// Логинимся под каждую сид-роль ОДИН раз и сохраняем storageState — спеки потом
// переиспользуют сессию (test.use({ storageState })).
//
// Логин — через API (cookie-режим: POST /api/auth/login кладёт httpOnly-куки в
// контекст), БЕЗ загрузки страницы входа. Это принципиально: множество подряд
// полных UI-логинов подвешивает dev-сервер turbopack (≈6-й стопорится на 30с+),
// а лёгкие API-вызовы — нет. pinLocale добавляет куку i18next (path=/), её сервер
// читает при рендере страниц. Требует сид-юзеров и бэкенд :8000.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';

for (const [role, email] of Object.entries(E2E_USERS)) {
  setup(`authenticate as ${role}`, async ({ context }) => {
    // Запас на 429-ретраи с Retry-After (~32с) при насыщении рейт-лимита логина.
    setup.setTimeout(180_000);
    await apiLogin(context, email, BASE_URL);
    await context.storageState({ path: `e2e/.auth/${role}.json` });
  });
}
