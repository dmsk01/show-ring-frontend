import { it, expect, describe } from 'vitest';

import { ANIMAL_AVAILABILITIES } from 'src/types/classified';

import {
  AVAILABILITY_COLOR,
  primaryImageFileId,
  formatClassifiedPrice,
  classifiedStatusI18nKey,
  classifiedCategoryI18nKey,
  classifiedPriceKindI18nKey,
  classifiedAvailabilityI18nKey,
} from '../classified-utils';

describe('formatClassifiedPrice', () => {
  it('formats a numeric price with digits', () => {
    expect(formatClassifiedPrice(1500)).toMatch(/1.?500/);
  });
  it('returns dash for null price', () => {
    expect(formatClassifiedPrice(null)).toBe('—');
  });
  it('formats zero price as a displayable string, not an i18n key', () => {
    const result = formatClassifiedPrice(0);
    expect(result).not.toMatch(/^enums\./);
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

describe('classifiedAvailabilityI18nKey', () => {
  it('returns correct i18n key for reserved', () => {
    expect(classifiedAvailabilityI18nKey('reserved')).toBe('enums.availability.reserved');
  });
  it('returns correct i18n key for sold', () => {
    expect(classifiedAvailabilityI18nKey('sold')).toBe('enums.availability.sold');
  });
});

describe('AVAILABILITY_COLOR', () => {
  it('covers every availability value', () => {
    ANIMAL_AVAILABILITIES.forEach((a) => {
      expect(AVAILABILITY_COLOR[a]).toBeTruthy();
    });
  });
  it('mutes sold and highlights available', () => {
    expect(AVAILABILITY_COLOR.available).toBe('success');
    expect(AVAILABILITY_COLOR.sold).toBe('default');
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
