import { it, expect, describe } from 'vitest';

import { passwordPolicy } from '../password-policy';

// ----------------------------------------------------------------------

const messages = { min: 'too short', max: 'too long', bytes: 'too many bytes' };
const schema = passwordPolicy(messages);

const firstError = (value: string): string | undefined => {
  const res = schema.safeParse(value);
  return res.success ? undefined : res.error.issues[0]?.message;
};

describe('passwordPolicy', () => {
  it('accepts a valid 8–128 char ASCII password', () => {
    expect(schema.safeParse('Password1').success).toBe(true);
  });

  it('rejects passwords shorter than 8 chars', () => {
    expect(firstError('Pass1')).toBe('too short');
  });

  it('rejects passwords longer than 128 chars', () => {
    expect(firstError('a'.repeat(129))).toBe('too long');
  });

  it('rejects passwords over 72 bytes UTF-8 even if under 128 chars', () => {
    // 40 кириллических символов = 80 байт UTF-8 (>72), но < 128 символов.
    expect(firstError('я'.repeat(40))).toBe('too many bytes');
  });

  it('accepts exactly 72 bytes', () => {
    expect(schema.safeParse('a'.repeat(72)).success).toBe(true);
  });
});
