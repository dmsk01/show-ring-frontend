import { it, expect, describe } from 'vitest';

import { EmailSchema, PasswordSchema } from '../profile-security-form';

// ----------------------------------------------------------------------

function firstError(result: ReturnType<typeof PasswordSchema.safeParse>): string | undefined {
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('EmailSchema', () => {
  it('accepts a valid email + password', () => {
    expect(EmailSchema.safeParse({ email: 'user@example.com', current_password: 'x' }).success).toBe(
      true
    );
  });

  it('rejects an empty email', () => {
    const res = EmailSchema.safeParse({ email: '', current_password: 'x' });
    expect(res.success).toBe(false);
  });

  it('rejects a malformed email (loose regex used to pass these)', () => {
    for (const email of ['not-an-email', 'a b@c.d', 'foo@bar']) {
      expect(EmailSchema.safeParse({ email, current_password: 'x' }).success).toBe(false);
    }
  });

  it('rejects a missing current password', () => {
    const res = EmailSchema.safeParse({ email: 'user@example.com', current_password: '' });
    expect(res.success).toBe(false);
  });
});

describe('PasswordSchema', () => {
  const valid = {
    current_password: 'old-pass-1',
    new_password: 'new-pass-1',
    confirm_password: 'new-pass-1',
  };

  it('accepts a well-formed password change', () => {
    expect(PasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects new_password shorter than 8 chars', () => {
    const res = PasswordSchema.safeParse({ ...valid, new_password: 'short', confirm_password: 'short' });
    expect(firstError(res)).toBe('Минимум 8 символов');
  });

  it('rejects new_password longer than 128 chars', () => {
    const long = 'a'.repeat(129);
    const res = PasswordSchema.safeParse({ ...valid, new_password: long, confirm_password: long });
    expect(firstError(res)).toBe('Максимум 128 символов');
  });

  it('rejects when confirm_password does not match (error on confirm_password)', () => {
    const res = PasswordSchema.safeParse({ ...valid, confirm_password: 'different-1' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toEqual(['confirm_password']);
      expect(res.error.issues[0]?.message).toBe('Пароли не совпадают');
    }
  });

  it('rejects when new_password equals current_password (error on new_password)', () => {
    const same = { current_password: 'same-pass-1', new_password: 'same-pass-1', confirm_password: 'same-pass-1' };
    const res = PasswordSchema.safeParse(same);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toEqual(['new_password']);
      expect(res.error.issues[0]?.message).toBe('Новый пароль совпадает с текущим');
    }
  });
});
