import type { TFunction } from 'i18next';
import type { LitterSchemaType } from '../litter-create-edit-form';

import { it, expect, describe } from 'vitest';

import { getLitterSchema, buildLitterPayload } from '../litter-create-edit-form';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-34: при правке помёта форма слала
// kennel_id/breed_id, которых нет в LitterUpdate, — бэкенд молча их
// отбрасывал, а пользователь видел «Сохранено»; диапазон цен не проверялся.

const t = ((key: string) => key) as unknown as TFunction;

const data: LitterSchemaType = {
  kennel_id: 'k1',
  breed_id: 'b1',
  status: 'planned',
  father_id: '',
  mother_id: null,
  born_at: '',
  puppies_count: '5',
  price_from: '30000',
  price_to: '50000',
  description: '',
};

describe('buildLitterPayload', () => {
  it('sends kennel and breed on create', () => {
    expect(buildLitterPayload(data, 'create')).toEqual({
      kennel_id: 'k1',
      breed_id: 'b1',
      status: 'planned',
      father_id: null,
      mother_id: null,
      born_at: null,
      description: null,
      puppies_count: 5,
      price_from: 30000,
      price_to: 50000,
    });
  });

  it('omits kennel and breed on edit — LitterUpdate does not accept them', () => {
    const payload = buildLitterPayload(data, 'edit');
    expect(payload).not.toHaveProperty('kennel_id');
    expect(payload).not.toHaveProperty('breed_id');
    expect(payload).toMatchObject({ status: 'planned', price_to: 50000 });
  });
});

describe('getLitterSchema', () => {
  it('rejects price_to lower than price_from', () => {
    const result = getLitterSchema(t).safeParse({
      ...data,
      price_from: '50000',
      price_to: '30000',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join('.'))).toContain('price_to');
  });

  it('accepts an open-ended price range', () => {
    expect(getLitterSchema(t).safeParse({ ...data, price_to: null }).success).toBe(true);
  });

  it('rejects a birth date that is not YYYY-MM-DD (FE-10)', () => {
    const result = getLitterSchema(t).safeParse({ ...data, born_at: '05.09.2026' });
    expect(result.error?.issues.map((i) => i.path.join('.'))).toContain('born_at');
  });
});
