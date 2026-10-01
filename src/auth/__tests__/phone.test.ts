import { it, expect, describe } from 'vitest';

import { phoneSchema, otpCodeSchema, resolveOtpErrorKey } from '../phone';

// ----------------------------------------------------------------------

const messages = { required: 'required', invalid: 'invalid' };

function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? undefined : result.error?.issues[0]?.message;
}

describe('phoneSchema', () => {
  const schema = phoneSchema(messages);

  it('accepts a valid E.164 number', () => {
    expect(schema.safeParse('+79991234567').success).toBe(true);
    expect(schema.safeParse('+12025550123').success).toBe(true);
  });

  it('rejects an empty value as required', () => {
    expect(firstError(schema.safeParse(''))).toBe('required');
  });

  it('rejects an impossible number', () => {
    expect(firstError(schema.safeParse('+7999'))).toBe('invalid');
    expect(firstError(schema.safeParse('89991234567'))).toBe('invalid');
  });
});

describe('otpCodeSchema', () => {
  const schema = otpCodeSchema(messages);

  it('accepts six digits', () => {
    expect(schema.safeParse('012345').success).toBe(true);
  });

  it('rejects short or non-digit codes', () => {
    expect(firstError(schema.safeParse(''))).toBe('required');
    expect(firstError(schema.safeParse('12345'))).toBe('invalid');
    expect(firstError(schema.safeParse('12a456'))).toBe('invalid');
  });
});

describe('resolveOtpErrorKey', () => {
  const apiError = (message: string, status?: number) => Object.assign(new Error(message), { status });

  it('maps backend codes to i18n keys', () => {
    expect(resolveOtpErrorKey(apiError('invalid_code', 400))).toBe('auth:errors.invalidCode');
    expect(resolveOtpErrorKey(apiError('code_expired', 401))).toBe('auth:errors.codeExpired');
    expect(resolveOtpErrorKey(apiError('sms_delivery_failed', 502))).toBe('auth:errors.smsFailed');
    expect(resolveOtpErrorKey(apiError('phone_taken', 409))).toBe('auth:errors.phoneTaken');
  });

  it('distinguishes OTP cooldown from the IP rate limiter', () => {
    expect(resolveOtpErrorKey(apiError('too_many_requests', 429))).toBe('auth:errors.tooManyCodes');
    expect(resolveOtpErrorKey(apiError('Too many requests', 429))).toBe(
      'auth:errors.tooManyRequests'
    );
  });

  it('treats 422 as an invalid phone by default, overridable per form', () => {
    expect(resolveOtpErrorKey(apiError('Request failed', 422))).toBe('auth:errors.phoneInvalid');
    expect(
      resolveOtpErrorKey(apiError('Request failed', 422), { on422: 'auth:errors.emailLoginInvalid' })
    ).toBe('auth:errors.emailLoginInvalid');
  });

  it('falls back to a generic message for unknown codes', () => {
    expect(resolveOtpErrorKey(apiError('something_new', 500))).toBe('auth:errors.generic');
  });
});
