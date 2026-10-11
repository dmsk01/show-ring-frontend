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

  // Браузерный URL-парсер вырезает \t \n \r до разбора: «/\t/host» → «//host».
  it('rejects paths that become protocol-relative after control chars are stripped', () => {
    expect(safeReturnTo('/\t/evil.example')).toBeNull();
    expect(safeReturnTo('/\n/evil.example')).toBeNull();
    expect(safeReturnTo('/\r\\evil.example')).toBeNull();
  });

  it('keeps query and hash of an in-app path', () => {
    expect(safeReturnTo('/shows/1/register?tab=a#top')).toBe('/shows/1/register?tab=a#top');
  });

  it('treats empty values as absent', () => {
    expect(safeReturnTo(null)).toBeNull();
    expect(safeReturnTo('')).toBeNull();
  });
});
