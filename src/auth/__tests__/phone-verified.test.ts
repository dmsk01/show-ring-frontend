import { it, expect, describe } from 'vitest';

import { safeReturnTo } from '../view/jwt/phone-verified';

// ----------------------------------------------------------------------

describe('safeReturnTo', () => {
  it('keeps in-app relative paths', () => {
    expect(safeReturnTo('/dashboard/shows?page=2')).toBe('/dashboard/shows?page=2');
  });

  it('rejects absolute, protocol-relative and script URLs', () => {
    expect(safeReturnTo('https://evil.example')).toBeNull();
    expect(safeReturnTo('//evil.example')).toBeNull();
    expect(safeReturnTo('/\\evil.example')).toBeNull();
    expect(safeReturnTo('javascript:alert(1)')).toBeNull();
  });

  it('treats empty values as absent', () => {
    expect(safeReturnTo(null)).toBeNull();
    expect(safeReturnTo('')).toBeNull();
  });
});
