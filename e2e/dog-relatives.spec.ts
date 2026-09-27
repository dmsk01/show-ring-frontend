import type { APIRequestContext } from '@playwright/test';

import { test, expect, request as apiRequest } from '@playwright/test';

import { t } from './i18n';

// ----------------------------------------------------------------------
// Потомки и сибсы собаки. Родство выводится бэкендом из father_id/mother_id:
// «Добавить потомка» у суки ставит её матерью выбранной собаке, «Убрать» —
// очищает эту связь. Сид — через API под breeder (владелец всех собак), UI —
// вкладка «Родственники» в дашборде + read-only секции на публичной странице.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';
const BREEDER = 'e2e/.auth/breeder.json';
const stamp = Date.now();

const names = {
  dam: `E2E Dam ${stamp}`,
  sire: `E2E Sire ${stamp}`,
  pup: `E2E Pup ${stamp}`,
  sibling: `E2E Sibling ${stamp}`,
  // Будущий потомок, которого привязываем через UI.
  newPup: `E2E NewPup ${stamp}`,
};
const ids: Record<keyof typeof names, string> = {
  dam: '',
  sire: '',
  pup: '',
  sibling: '',
  newPup: '',
};

async function createDog(api: APIRequestContext, data: Record<string, unknown>): Promise<string> {
  const res = await api.post(`${BASE_URL}/api/dogs`, { data });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()).id;
}

test.describe.serial('Dog relatives — descendants & siblings', () => {
  test.use({ storageState: BREEDER });

  test.beforeAll(async () => {
    const api = await apiRequest.newContext({ storageState: BREEDER });
    try {
      const breeds = await (await api.get(`${BASE_URL}/api/references/breeds`)).json();
      const breedId = (Array.isArray(breeds) ? breeds : breeds.items)[0].id;
      const base = { breed_id: breedId };

      ids.dam = await createDog(api, { ...base, name: names.dam, sex: 'female' });
      ids.sire = await createDog(api, { ...base, name: names.sire, sex: 'male' });
      const parents = { father_id: ids.sire, mother_id: ids.dam };
      ids.pup = await createDog(api, { ...base, ...parents, name: names.pup, sex: 'male' });
      ids.sibling = await createDog(api, {
        ...base,
        ...parents,
        name: names.sibling,
        sex: 'female',
      });
      ids.newPup = await createDog(api, { ...base, name: names.newPup, sex: 'male' });
    } finally {
      await api.dispose();
    }
  });

  test('dam lists her descendants with the sire; pup lists a full sibling', async ({ page }) => {
    await page.goto(`/dashboard/dogs/${ids.dam}`);
    await page.getByRole('tab', { name: t('dog', 'detail.relatives') }).click();

    await expect(page.getByRole('link', { name: names.pup })).toBeVisible();
    await expect(page.getByRole('link', { name: names.sibling })).toBeVisible();
    // Отец — «второй родитель» у обоих потомков суки.
    await expect(page.getByRole('link', { name: names.sire })).toHaveCount(2);

    await page.goto(`/dashboard/dogs/${ids.pup}`);
    await page.getByRole('tab', { name: t('dog', 'detail.relatives') }).click();
    await expect(page.getByRole('link', { name: names.sibling })).toBeVisible();
    await expect(page.getByText(t('dog', 'relatives.full'))).toBeVisible();
  });

  test('add a descendant via the picker, then remove it', async ({ page }) => {
    await page.goto(`/dashboard/dogs/${ids.dam}`);
    await page.getByRole('tab', { name: t('dog', 'detail.relatives') }).click();

    await page.getByRole('button', { name: t('dog', 'relatives.addDescendant') }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(t('dog', 'relatives.pickDog')).fill(names.newPup);
    await page.getByRole('option', { name: names.newPup }).click();

    const addResp = page.waitForResponse(
      (r) => r.url().endsWith(`/api/dogs/${ids.dam}/descendants`) && r.request().method() === 'POST'
    );
    await dialog.getByRole('button', { name: t('dog', 'relatives.add'), exact: true }).click();
    expect((await addResp).status()).toBe(201);

    await expect(page.getByText(t('dog', 'relatives.toast.added'))).toBeVisible();
    await expect(page.getByRole('link', { name: names.newPup })).toBeVisible();

    // Убираем: кнопка в строке нового потомка → подтверждение.
    const row = page
      .locator('div')
      .filter({ has: page.getByRole('link', { name: names.newPup }) })
      .filter({ has: page.getByRole('button', { name: t('dog', 'relatives.removeDescendant') }) })
      .last();
    await row.getByRole('button', { name: t('dog', 'relatives.removeDescendant') }).click();

    const removeResp = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/dogs/${ids.dam}/descendants/${ids.newPup}`) &&
        r.request().method() === 'DELETE'
    );
    await page
      .getByRole('button', { name: t('dog', 'relatives.removeConfirm'), exact: true })
      .click();
    expect((await removeResp).status()).toBe(204);

    await expect(page.getByRole('link', { name: names.newPup })).toHaveCount(0);
    // Изначальный потомок на месте.
    await expect(page.getByRole('link', { name: names.pup })).toBeVisible();
  });

  test('public dog page shows descendants and siblings read-only', async ({ page }) => {
    await page.goto(`/dogs/${ids.pup}`);

    await expect(
      page.getByRole('heading', { name: t('dog', 'relatives.siblings') + ' (1)' })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: names.sibling })).toBeVisible();
    // Без правки на витрине.
    await expect(
      page.getByRole('button', { name: t('dog', 'relatives.addDescendant') })
    ).toHaveCount(0);
  });

  test.afterAll(async () => {
    const api = await apiRequest.newContext({ storageState: BREEDER });
    try {
      // Сначала дети, затем родители (порядок не критичен — FK SET NULL).
      for (const key of ['newPup', 'pup', 'sibling', 'sire', 'dam'] as const) {
        if (ids[key]) await api.delete(`${BASE_URL}/api/dogs/${ids[key]}`);
      }
    } catch {
      // ignore cleanup errors
    } finally {
      await api.dispose();
    }
  });
});
