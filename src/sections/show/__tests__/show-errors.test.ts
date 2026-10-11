import { it, expect, describe } from 'vitest';

import enShow from 'src/locales/langs/en/show.json';
import ruShow from 'src/locales/langs/ru/show.json';

import { SHOW_ERRORS, showErrorMessage } from '../show-errors';

// ----------------------------------------------------------------------

function lookup(dict: Record<string, unknown>, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], dict);
}

describe('SHOW_ERRORS', () => {
  // Коды, которые бэкенд отдаёт после ревью 2026-10-06 (BE-03/14/23/26).
  it.each([
    'placement_taken',
    'entries_class_mismatch',
    'show_not_in_progress',
    'entry_not_admitted',
    'registration_locked',
    'invalid_dates',
  ])('maps %s', (code) => {
    expect(SHOW_ERRORS[code]).toBeDefined();
  });

  it('every key is translated in ru and en', () => {
    for (const key of Object.values(SHOW_ERRORS)) {
      const path = key.replace(/^show:/, '');
      expect(typeof lookup(ruShow, path), `ru ${key}`).toBe('string');
      expect(typeof lookup(enShow, path), `en ${key}`).toBe('string');
    }
  });
});

// Ревью фронтенда 2026-10-09, FE-14: на 422 тост показывал «Request failed»,
// на неизвестный код — сам код.
describe('showErrorMessage', () => {
  const t = (key: string) => `t(${key})`;
  const err = (message: string, status?: number) => Object.assign(new Error(message), { status });

  it('translates known codes', () => {
    expect(showErrorMessage(err('placement_taken', 409), t, 'common:state.error')).toBe(
      't(show:errors.placementTaken)'
    );
  });

  it('shows a validation message instead of «Request failed» on 422', () => {
    expect(showErrorMessage(err('Request failed', 422), t, 'common:state.error')).toBe(
      't(common:errors.validation)'
    );
  });

  it('never shows a raw backend code', () => {
    expect(showErrorMessage(err('some_new_code', 400), t, 'toast.saveFailed')).toBe(
      't(toast.saveFailed)'
    );
  });
});
