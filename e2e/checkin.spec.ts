import type { APIRequestContext } from '@playwright/test';

import { test, expect, request as apiRequest } from '@playwright/test';

import { t } from './i18n';

// ----------------------------------------------------------------------
// Стойка регистрации на выставке: поиск участника и отметка прибытия.
// Ревью фронтенда 2026-10-09, FE-30.
//
// Предусловия готовим через API (UI создания собаки, выставки и записи уже
// покрыт show-entry/results): собака → выставка → открыть регистрацию →
// запись → закрыть регистрацию → включить чек-ин. Сессия — admin, он же
// организатор созданной выставки и, значит, имеет доступ к стойке.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const ADMIN = 'e2e/.auth/admin.json';
const stamp = Date.now();
const dogName = `E2E Checkin Dog ${stamp}`;

let showId = '';
let dogId = '';

async function ok<T>(res: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  if (!res.ok()) throw new Error(`${res.url()} → HTTP ${res.status()} ${await res.text()}`);
  return (await res.json()) as T;
}

test.use({ storageState: ADMIN });

test('desk finds the participant and marks the arrival', async ({ page }) => {
  const api = page.request;

  const breeds = await ok<{ items: { id: string }[] }>(
    await api.get('/api/references/breeds?per_page=1')
  );
  const ranks = await ok<{ id: string }[]>(await api.get('/api/references/show-ranks'));

  dogId = (
    await ok<{ id: string }>(
      await api.post('/api/dogs', {
        data: {
          name: dogName,
          sex: 'male',
          breed_id: breeds.items[0].id,
          date_of_birth: '2022-01-01',
        },
      })
    )
  ).id;

  showId = (
    await ok<{ id: string }>(
      await api.post('/api/shows', {
        data: {
          name: `E2E Checkin Show ${stamp}`,
          rank_id: ranks[0].id,
          date_start: '2026-12-01',
          city: `E2E-Checkin-${stamp}`,
        },
      })
    )
  ).id;

  const setStatus = async (status: string) =>
    ok(await api.put(`/api/shows/${showId}/status`, { data: { status } }));

  await setStatus('registration_open');
  const { classes } = await ok<{ classes: { id: string }[] }>(
    await api.get(`/api/shows/${showId}/available-classes/${dogId}`)
  );
  await ok(
    await api.post(`/api/shows/${showId}/entries`, {
      data: { dog_id: dogId, show_class_id: classes[0].id },
    })
  );
  await setStatus('registration_closed');
  await ok(await api.put(`/api/shows/${showId}/checkin/settings`, { data: { enabled: true } }));

  // Стойка: поиск по кличке → карточка участника → «Только прибыла».
  await page.goto(`/dashboard/shows/${showId}/checkin`);
  await page.getByPlaceholder(t('checkin', 'desk.searchPlaceholder')).fill(dogName);

  const card = page.locator('.MuiCard-root').filter({ hasText: dogName });
  await expect(card).toBeVisible();
  await expect(card.getByText(t('checkin', 'attendance.registered'))).toBeVisible();

  const mark = page.waitForResponse(
    (r) =>
      /\/api\/shows\/[^/]+\/entries\/[^/]+\/checks\/?$/.test(r.url()) &&
      r.request().method() === 'POST'
  );
  await card.getByRole('button', { name: t('checkin', 'desk.arrivalOnly') }).click();
  expect((await mark).ok()).toBeTruthy();

  await expect(card.getByText(t('checkin', 'attendance.arrived'))).toBeVisible();
});

test.afterAll(async () => {
  const ctx = await apiRequest.newContext({ storageState: ADMIN });
  try {
    if (showId) await ctx.delete(`${BASE_URL}/api/shows/${showId}`);
    if (dogId) await ctx.delete(`${BASE_URL}/api/dogs/${dogId}`);
  } catch {
    // ignore cleanup errors
  } finally {
    await ctx.dispose();
  }
});
