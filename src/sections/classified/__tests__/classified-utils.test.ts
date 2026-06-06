import { it, expect, describe } from 'vitest';

import {
  primaryImageFileId,
  formatClassifiedPrice,
  classifiedStatusI18nKey,
  classifiedCategoryI18nKey,
  classifiedPriceKindI18nKey,
} from '../classified-utils';

describe('formatClassifiedPrice', () => {
  it('returns i18n key for free kind', () => {
    expect(formatClassifiedPrice(0, 'free')).toBe('enums.priceKind.free');
  });
  it('returns i18n key for negotiable kind', () => {
    expect(formatClassifiedPrice(null, 'negotiable')).toBe('enums.priceKind.negotiable');
  });
  it('formats a fixed price with digits', () => {
    expect(formatClassifiedPrice(1500, 'fixed')).toMatch(/1.?500/);
  });
  it('returns dash for fixed without price', () => {
    expect(formatClassifiedPrice(null, 'fixed')).toBe('—');
  });
});

describe('primaryImageFileId', () => {
  it('prefers the primary image', () => {
    expect(
      primaryImageFileId([
        { file_id: 'a', is_primary: false },
        { file_id: 'b', is_primary: true },
      ])
    ).toBe('b');
  });
  it('falls back to the first image', () => {
    expect(primaryImageFileId([{ file_id: 'a' }, { file_id: 'b' }])).toBe('a');
  });
  it('returns undefined for empty', () => {
    expect(primaryImageFileId([])).toBeUndefined();
  });
});

describe('classifiedCategoryI18nKey', () => {
  it('returns correct i18n key for puppy_sale', () => {
    expect(classifiedCategoryI18nKey('puppy_sale')).toBe('enums.category.puppy_sale');
  });
  it('returns correct i18n key for other', () => {
    expect(classifiedCategoryI18nKey('other')).toBe('enums.category.other');
  });
});

describe('classifiedPriceKindI18nKey', () => {
  it('returns correct i18n key for fixed', () => {
    expect(classifiedPriceKindI18nKey('fixed')).toBe('enums.priceKind.fixed');
  });
  it('returns correct i18n key for free', () => {
    expect(classifiedPriceKindI18nKey('free')).toBe('enums.priceKind.free');
  });
});

describe('classifiedStatusI18nKey', () => {
  it('returns correct i18n key for active', () => {
    expect(classifiedStatusI18nKey('active')).toBe('enums.status.active');
  });
  it('returns correct i18n key for moderation', () => {
    expect(classifiedStatusI18nKey('moderation')).toBe('enums.status.moderation');
  });
});
