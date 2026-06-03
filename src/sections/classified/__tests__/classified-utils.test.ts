import { it, expect, describe } from 'vitest';

import { primaryImageFileId, formatClassifiedPrice } from '../classified-utils';

describe('formatClassifiedPrice', () => {
  it('labels free', () => {
    expect(formatClassifiedPrice(0, 'free')).toBe('Бесплатно');
  });
  it('labels negotiable', () => {
    expect(formatClassifiedPrice(null, 'negotiable')).toBe('Договорная');
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
