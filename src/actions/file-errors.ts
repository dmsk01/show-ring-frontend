import type { ApiError } from 'src/lib/axios';

import i18next from 'i18next';

import { fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------
// Разбор ошибок загрузки файлов. Бэкенд ужесточил POST /files/upload новыми
// кодами; axios-интерсептор сохраняет `status`/`response` на ошибке (см.
// src/lib/axios.ts), что позволяет достать `reset_at`/`Retry-After` и т.п.
// ----------------------------------------------------------------------

export type UploadErrorCode =
  | 'rate_limited' // 429 — суточный лимит загрузок
  | 'storage_full' // 413 — исчерпана квота объёма аккаунта
  | 'unsupported_type' // 415 / клиентский гейт
  | 'file_too_large' // 413 (размер) / клиентский гейт
  | 'storage_busy' // 503 — backpressure хранилища
  | 'generic';

export class UploadError extends Error {
  code: UploadErrorCode;

  retryAfterSeconds?: number;

  resetAt?: string;

  constructor(code: UploadErrorCode, init?: { retryAfterSeconds?: number; resetAt?: string }) {
    super(code);
    this.name = 'UploadError';
    this.code = code;
    this.retryAfterSeconds = init?.retryAfterSeconds;
    this.resetAt = init?.resetAt;
  }
}

function headerRetryAfter(error: ApiError): number | undefined {
  const raw = error.response?.headers?.['retry-after'];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Сводит произвольную ошибку загрузки к типизированному UploadError. Чистая
 * функция (i18n — в uploadErrorMessage). Уже типизированный UploadError
 * возвращается как есть.
 */
export function parseUploadError(error: unknown): UploadError {
  if (error instanceof UploadError) return error;

  const apiError = error as ApiError;
  const status = apiError?.status ?? apiError?.response?.status;
  const data = (apiError?.response?.data ?? {}) as Record<string, unknown>;

  switch (status) {
    case 429:
      return new UploadError('rate_limited', {
        retryAfterSeconds:
          (typeof data.retry_after_seconds === 'number' ? data.retry_after_seconds : undefined) ??
          headerRetryAfter(apiError),
        resetAt: typeof data.reset_at === 'string' ? data.reset_at : undefined,
      });
    case 413:
      // Квота объёма аккаунта несёт max_storage_bytes; пер-файловый размер — нет.
      return 'max_storage_bytes' in data
        ? new UploadError('storage_full')
        : new UploadError('file_too_large');
    case 415:
      return new UploadError('unsupported_type');
    case 503:
      return new UploadError('storage_busy', { retryAfterSeconds: headerRetryAfter(apiError) });
    default:
      return new UploadError('generic');
  }
}

/**
 * Выбор i18n-ключа (и параметров интерполяции) по ошибке. Чистая функция —
 * не зависит от рантайма i18next, поэтому юнит-тестируема.
 */
export function uploadErrorMessageKey(error: unknown): {
  key: string;
  options?: Record<string, unknown>;
} {
  const ue = parseUploadError(error);

  switch (ue.code) {
    case 'rate_limited':
      return ue.resetAt
        ? { key: 'common:upload.rateLimitedUntil', options: { time: fDateTime(ue.resetAt) } }
        : { key: 'common:upload.rateLimited' };
    case 'storage_full':
      return { key: 'common:upload.storageFull' };
    case 'file_too_large':
      return { key: 'common:upload.fileTooLarge' };
    case 'unsupported_type':
      return { key: 'common:upload.unsupportedType' };
    case 'storage_busy':
      return { key: 'common:upload.storageBusy' };
    default:
      return { key: 'common:upload.generic' };
  }
}

/** Локализованное человекочитаемое сообщение для тоста. */
export function uploadErrorMessage(error: unknown): string {
  const { key, options } = uploadErrorMessageKey(error);
  return i18next.t(key, options);
}
