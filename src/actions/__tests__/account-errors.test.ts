import { it, expect, describe } from 'vitest';

import { accountErrorMessage } from '../account-errors';

describe('accountErrorMessage', () => {
  it('maps known backend codes to RU messages', () => {
    expect(accountErrorMessage(new Error('current_password_invalid'))).toBe(
      'Неверный текущий пароль'
    );
    expect(accountErrorMessage(new Error('email_taken'))).toBe('Этот email уже занят');
    expect(accountErrorMessage(new Error('password_same_as_current'))).toBe(
      'Новый пароль совпадает с текущим'
    );
    expect(accountErrorMessage(new Error('invalid_or_expired_token'))).toBe(
      'Ссылка недействительна или устарела'
    );
  });

  it('falls back to the raw message for human-readable text', () => {
    expect(accountErrorMessage(new Error('Сервис недоступен'))).toBe('Сервис недоступен');
    // Сетевой fallback axios-интерсептора содержит пробелы → показываем как есть.
    expect(accountErrorMessage(new Error('Something went wrong!'))).toBe('Something went wrong!');
  });

  it('hides unknown machine codes behind a generic RU message', () => {
    expect(accountErrorMessage(new Error('some_future_code'))).toBe(
      'Не удалось выполнить операцию. Попробуйте позже.'
    );
    expect(accountErrorMessage(new Error('rate_limited'))).toBe(
      'Не удалось выполнить операцию. Попробуйте позже.'
    );
  });
});
