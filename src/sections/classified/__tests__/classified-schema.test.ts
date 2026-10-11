import { it, expect, describe } from 'vitest';

import { getClassifiedSchema, buildClassifiedBase } from '../classified-create-edit-form';

// ----------------------------------------------------------------------

// Identity t: returns the key so we can assert on i18n keys (interpolation ignored).
const t = ((k: string) => k) as any;

const ClassifiedSchema = getClassifiedSchema(t);

const base = {
  category: 'puppy_sale' as const,
  title: 'Valid title',
  description: 'Long enough description',
  price_kind: 'fixed' as const,
  availability: 'available' as const,
  published: true,
  breed_id: '',
  price: '1000',
  city: null,
  contact_phone: null,
  contact_email: null,
  contacts_public: false,
};

function issueAt(result: ReturnType<typeof ClassifiedSchema.safeParse>, field: string) {
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path[0] === field)?.message;
}

// ----------------------------------------------------------------------

describe('getClassifiedSchema — fixed price requires amount > 0 (mirrors backend)', () => {
  it('accepts a fixed price with a positive amount', () => {
    expect(ClassifiedSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a fixed price with no amount', () => {
    const res = ClassifiedSchema.safeParse({ ...base, price: null });
    expect(res.success).toBe(false);
    expect(issueAt(res, 'price')).toBe('form.validation.priceRequiredFixed');
  });

  it('rejects a fixed price of 0', () => {
    const res = ClassifiedSchema.safeParse({ ...base, price: '0' });
    expect(res.success).toBe(false);
    expect(issueAt(res, 'price')).toBe('form.validation.priceRequiredFixed');
  });

  it('allows free with no price', () => {
    expect(ClassifiedSchema.safeParse({ ...base, price_kind: 'free', price: null }).success).toBe(
      true
    );
  });

  it('allows negotiable with no price', () => {
    expect(
      ClassifiedSchema.safeParse({ ...base, price_kind: 'negotiable', price: null }).success
    ).toBe(true);
  });

  it('still enforces a non-negative price for non-fixed kinds', () => {
    const res = ClassifiedSchema.safeParse({ ...base, price_kind: 'negotiable', price: '-5' });
    expect(res.success).toBe(false);
    expect(issueAt(res, 'price')).toBe('form.validation.priceInvalid');
  });
});

// Ревью фронтенда 2026-10-09, FE-31: при смене типа цены на «договорная»
// старая цена уходила в запросе, и бэкенд отвечал 422.
describe('buildClassifiedBase', () => {
  it('drops the price unless price_kind is fixed', () => {
    expect(
      buildClassifiedBase({ ...base, price_kind: 'negotiable', price: '15000' }).price
    ).toBeNull();
    expect(buildClassifiedBase({ ...base, price_kind: 'free', price: '15000' }).price).toBeNull();
    expect(buildClassifiedBase({ ...base, price_kind: 'fixed', price: '15000' }).price).toBe(15000);
  });
});

describe('price limits mirror the backend (≤ 10 000 000, 2 decimals)', () => {
  it('rejects a price above the maximum', () => {
    expect(issueAt(ClassifiedSchema.safeParse({ ...base, price: '10000001' }), 'price')).toBe(
      'form.validation.priceInvalid'
    );
  });

  it('rejects more than two decimals', () => {
    expect(issueAt(ClassifiedSchema.safeParse({ ...base, price: '10.555' }), 'price')).toBe(
      'form.validation.priceInvalid'
    );
  });

  it('accepts the maximum with kopecks', () => {
    expect(ClassifiedSchema.safeParse({ ...base, price: '10000000.00' }).success).toBe(true);
  });
});
