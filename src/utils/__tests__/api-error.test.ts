import { it, expect, describe } from 'vitest';

import { apiErrorKey, isNotFoundError, apiErrorMessageKey } from '../api-error';

// ----------------------------------------------------------------------

const MAP = { placement_taken: 'show:errors.placementTaken' } as const;

describe('apiErrorKey', () => {
  it('maps a known backend code to its i18n key', () => {
    expect(apiErrorKey(new Error('placement_taken'), MAP)).toBe('show:errors.placementTaken');
  });

  it('is case-insensitive and trims', () => {
    expect(apiErrorKey(new Error(' Placement_Taken '), MAP)).toBe('show:errors.placementTaken');
  });

  it('returns null for unknown codes and non-errors', () => {
    expect(apiErrorKey(new Error('something_else'), MAP)).toBeNull();
    expect(apiErrorKey(undefined, MAP)).toBeNull();
  });
});

// Ревью фронтенда 2026-10-09, FE-14/FE-15: пользователь видел коды бэкенда
// («forbidden», «duplicate_prefix»), «Request failed» на 422 и «Network Error».
describe('apiErrorMessageKey', () => {
  const err = (message: string, status?: number) => Object.assign(new Error(message), { status });

  it('prefers a known backend code from the map', () => {
    expect(apiErrorMessageKey(err('placement_taken', 409), MAP, 'x')).toBe(
      'show:errors.placementTaken'
    );
  });

  it.each([
    ['validation (422)', err('Request failed', 422), 'common:errors.validation'],
    ['forbidden (403)', err('forbidden', 403), 'common:errors.forbidden'],
    ['not found (404)', err('not_found', 404), 'common:errors.notFound'],
    ['rate limit (429)', err('Too many requests', 429), 'common:errors.tooManyRequests'],
    ['server error (503)', err('rate limit subsystem unavailable', 503), 'common:errors.server'],
    ['network error', err('Network Error'), 'common:errors.network'],
  ])('maps %s to a generic message', (_name, error, key) => {
    expect(apiErrorMessageKey(error, MAP, 'common:state.error')).toBe(key);
  });

  it('falls back for unknown codes instead of showing them', () => {
    expect(apiErrorMessageKey(err('duplicate_prefix', 400), MAP, 'kennel:toast.saveFailed')).toBe(
      'kennel:toast.saveFailed'
    );
    expect(apiErrorMessageKey(undefined, MAP, 'common:state.error')).toBe('common:state.error');
  });
});

// FE-16: детальные страницы показывали «не найдено» и на 500/без сети.
describe('isNotFoundError', () => {
  const err = (status?: number) => Object.assign(new Error('x'), { status });

  it('is true only for 404', () => {
    expect(isNotFoundError(err(404))).toBe(true);
    expect(isNotFoundError(err(500))).toBe(false);
    expect(isNotFoundError(err(undefined))).toBe(false);
    expect(isNotFoundError(undefined)).toBe(false);
  });
});
