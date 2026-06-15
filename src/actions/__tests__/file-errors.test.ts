import { it, expect, describe } from 'vitest';

import { UploadError, parseUploadError, uploadErrorMessageKey } from '../file-errors';

// Минимальный двойник ApiError из axios-интерсептора: несёт status + response.
function apiError(
  status: number,
  data: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  const err = new Error('boom') as Error & {
    status?: number;
    response?: { status: number; data: Record<string, unknown>; headers: Record<string, string> };
  };
  err.status = status;
  err.response = { status, data, headers };
  return err;
}

describe('parseUploadError', () => {
  it('429 → rate_limited with reset_at and retry_after_seconds', () => {
    const ue = parseUploadError(
      apiError(429, { reset_at: '2026-06-15T20:00:00Z', retry_after_seconds: 3600 })
    );
    expect(ue.code).toBe('rate_limited');
    expect(ue.resetAt).toBe('2026-06-15T20:00:00Z');
    expect(ue.retryAfterSeconds).toBe(3600);
  });

  it('429 falls back to the Retry-After header when body lacks seconds', () => {
    const ue = parseUploadError(apiError(429, {}, { 'retry-after': '120' }));
    expect(ue.code).toBe('rate_limited');
    expect(ue.retryAfterSeconds).toBe(120);
  });

  it('413 with max_storage_bytes → storage_full', () => {
    const ue = parseUploadError(apiError(413, { max_storage_bytes: 1000, used_bytes: 1000 }));
    expect(ue.code).toBe('storage_full');
  });

  it('413 without quota body → file_too_large', () => {
    expect(parseUploadError(apiError(413, { detail: 'too big' })).code).toBe('file_too_large');
  });

  it('415 → unsupported_type', () => {
    expect(parseUploadError(apiError(415)).code).toBe('unsupported_type');
  });

  it('503 → storage_busy with header retry-after', () => {
    const ue = parseUploadError(apiError(503, {}, { 'retry-after': '5' }));
    expect(ue.code).toBe('storage_busy');
    expect(ue.retryAfterSeconds).toBe(5);
  });

  it('unknown status → generic', () => {
    expect(parseUploadError(apiError(500)).code).toBe('generic');
  });

  it('passes an existing UploadError through unchanged', () => {
    const original = new UploadError('file_too_large');
    expect(parseUploadError(original)).toBe(original);
  });
});

describe('uploadErrorMessageKey', () => {
  it('maps each status to the expected i18n key', () => {
    expect(uploadErrorMessageKey(apiError(413, { max_storage_bytes: 1 })).key).toBe(
      'common:upload.storageFull'
    );
    expect(uploadErrorMessageKey(apiError(413)).key).toBe('common:upload.fileTooLarge');
    expect(uploadErrorMessageKey(apiError(415)).key).toBe('common:upload.unsupportedType');
    expect(uploadErrorMessageKey(apiError(503)).key).toBe('common:upload.storageBusy');
    expect(uploadErrorMessageKey(apiError(500)).key).toBe('common:upload.generic');
  });

  it('429 without reset_at → plain rate-limited key (no interpolation)', () => {
    const result = uploadErrorMessageKey(apiError(429));
    expect(result.key).toBe('common:upload.rateLimited');
    expect(result.options).toBeUndefined();
  });

  it('429 with reset_at → "until" key carrying a formatted time', () => {
    const result = uploadErrorMessageKey(apiError(429, { reset_at: '2026-06-15T20:00:00Z' }));
    expect(result.key).toBe('common:upload.rateLimitedUntil');
    expect(typeof result.options?.time).toBe('string');
    expect((result.options?.time as string).length).toBeGreaterThan(0);
  });

  it('passes a client-side UploadError through to its key', () => {
    expect(uploadErrorMessageKey(new UploadError('unsupported_type')).key).toBe(
      'common:upload.unsupportedType'
    );
  });
});
