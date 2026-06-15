import { it, expect, describe } from 'vitest';

import { getClassifiedSchema } from '../classified-create-edit-form';

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
