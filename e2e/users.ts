import type { BrowserContext } from '@playwright/test';

import { pinLocale } from './i18n';

// ----------------------------------------------------------------------
// Сид-пользователи e2e (создаются на бэкенде: `python -m scripts.seed_e2e_users
// --force`). Все active + email_verified, пароль общий.
//
// ВАЖНО про домен: НЕ `.test` — pydantic EmailStr (email-validator) отвергает
// зарезервированные TLD (.test/.local/.invalid/.localhost) и /auth/login отдаёт
// 422 ещё до проверки пароля. Используем `e2e.example` — валиден и зарезервирован
// под тесты (RFC 2606), письма недоставляемы. Это и есть «одна константа домена».
// ----------------------------------------------------------------------

export const E2E_DOMAIN = 'e2e.example';
export const E2E_PASSWORD = 'Password123!';

export const E2E_USERS = {
  organizer: `organizer@${E2E_DOMAIN}`,
  breeder: `breeder@${E2E_DOMAIN}`,
  judge: `judge@${E2E_DOMAIN}`,
  buyer: `buyer@${E2E_DOMAIN}`,
  operator: `operator@${E2E_DOMAIN}`,
  /** Мульти-роль: breeder + organizer — для проверки union прав. */
  multi: `multi@${E2E_DOMAIN}`,
} as const;

/**
 * Cookie-режим логин через API: POST /api/auth/login кладёт httpOnly-куки прямо
 * в контекст (без загрузки страницы входа). pinLocale добавляет куку i18next.
 *
 * Бэкенд РЕЙТ-ЛИМИТИТ /auth/login (429 + Retry-After ≈ 32с, порог ~5 логинов на
 * окно), а полному e2e-прогону нужно ~7 сессий — поэтому ретраим на 429, уважая
 * Retry-After, в пределах бюджета. Долгосрочно лучше ослабить лимит для теста на
 * бэке (env-флаг / exemption для localhost), чтобы не платить 32с ожидания.
 */
export async function apiLogin(
  context: BrowserContext,
  email: string,
  baseUrl: string,
  budgetMs = 140_000
): Promise<void> {
  await pinLocale(context, baseUrl);

  const deadline = Date.now() + budgetMs;
  let lastStatus = 0;
  let lastBody = '';

  while (Date.now() < deadline) {
    const res = await context.request.post('/api/auth/login', {
      data: { email, password: E2E_PASSWORD },
    });
    if (res.ok()) return;

    lastStatus = res.status();
    lastBody = await res.text();
    if (lastStatus !== 429) break;

    const retryAfter = Number(res.headers()['retry-after']);
    const waitSec = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 35) : 5;
    await new Promise((resolve) => setTimeout(resolve, waitSec * 1000 + 500));
  }

  throw new Error(`API login failed for ${email}: HTTP ${lastStatus} ${lastBody}`);
}
