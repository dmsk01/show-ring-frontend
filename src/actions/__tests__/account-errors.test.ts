import { it, expect, describe } from 'vitest';

import { accountErrorKey } from '../account-errors';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-27/FE-15: сообщения были захардкожены по-русски
// и показывали сырой текст ошибки («Something went wrong!»). Теперь — i18n-ключи.

const err = (message: string, status?: number) => Object.assign(new Error(message), { status });

describe('accountErrorKey', () => {
  it.each([
    ['current_password_invalid', 'account:errors.currentPasswordInvalid'],
    ['email_taken', 'account:errors.emailTaken'],
    ['password_same_as_current', 'account:errors.passwordSameAsCurrent'],
    ['invalid_or_expired_token', 'account:errors.invalidOrExpiredToken'],
  ])('maps %s', (code, key) => {
    expect(accountErrorKey(err(code, 400))).toBe(key);
  });

  it('uses generic messages by status and never shows raw text', () => {
    expect(accountErrorKey(err('Too many requests', 429))).toBe('common:errors.tooManyRequests');
    expect(accountErrorKey(err('Something went wrong!', 400))).toBe('account:errors.generic');
    expect(accountErrorKey(err('some_future_code', 400))).toBe('account:errors.generic');
  });
});
