import { it, expect, describe } from 'vitest';

import { getEmailLoginSchema } from '../profile-sign-in-methods';

// ----------------------------------------------------------------------

// Identity t: returns the key as-is so we can assert on i18n key strings.
const t = ((k: string) => k) as any;

const EmailLoginSchema = getEmailLoginSchema(t);

const valid = { email: 'user@example.com', password: 'new-pass-1', confirm_password: 'new-pass-1' };

describe('EmailLoginSchema', () => {
  it('accepts an email with a matching policy-compliant password', () => {
    expect(EmailLoginSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(EmailLoginSchema.safeParse({ ...valid, email: 'foo@bar' }).success).toBe(false);
  });

  it('applies the registration password policy', () => {
    const res = EmailLoginSchema.safeParse({ ...valid, password: 'short', confirm_password: 'short' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe('profile:validation.passwordMin');
    }
  });

  it('reports a mismatch on confirm_password', () => {
    const res = EmailLoginSchema.safeParse({ ...valid, confirm_password: 'other-pass-1' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toEqual(['confirm_password']);
      expect(res.error.issues[0]?.message).toBe('profile:validation.passwordMismatch');
    }
  });
});
