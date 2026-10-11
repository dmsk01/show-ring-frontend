import { test, expect } from '@playwright/test';

import { t } from './i18n';

// ----------------------------------------------------------------------
// Экран согласий (152-ФЗ): если у пользователя нет действующего согласия на
// актуальную редакцию документов, кабинет закрыт диалогом ConsentGate до
// принятия. Ревью фронтенда 2026-10-09, FE-30.
//
// Сессия — operator: другие спеки её не используют, а отзыв согласия меняет
// состояние пользователя. В конце теста согласие снова принято.
// ----------------------------------------------------------------------

test.use({ storageState: 'e2e/.auth/operator.json' });

test('consent gate blocks the dashboard until the consents are accepted', async ({ page }) => {
  // Как после новой редакции документа: действующего согласия на ПДн нет.
  const revoke = await page.request.delete('/api/users/me/consents/personal_data');
  expect(revoke.ok()).toBeTruthy();
  expect((await revoke.json()).missing).toContain('personal_data');

  await page.goto('/dashboard/profile');

  const gate = page.getByRole('dialog', { name: t('legal', 'gate.title') });
  await expect(gate).toBeVisible();

  // Принять без отметки согласия на ПДн нельзя.
  const accept = gate.getByRole('button', { name: t('legal', 'gate.accept') });
  await expect(accept).toBeDisabled();

  await gate.getByRole('checkbox').check();
  const grant = page.waitForResponse(
    (r) => /\/api\/users\/me\/consents\/?$/.test(r.url()) && r.request().method() === 'POST'
  );
  await accept.click();
  expect((await grant).ok()).toBeTruthy();

  await expect(gate).toBeHidden();
  const consents = await (await page.request.get('/api/users/me/consents')).json();
  expect(consents.missing).toEqual([]);
});
