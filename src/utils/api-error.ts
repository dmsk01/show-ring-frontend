import { getErrorMessage } from 'src/auth/utils/error-message';

// ----------------------------------------------------------------------

/**
 * i18n-ключ для машиночитаемого кода ошибки бэкенда (detail ответа), либо
 * null, если код не из карты. Бэкенд отдаёт коды вида `placement_taken` —
 * показывать их пользователю как есть нельзя. Сравнение без учёта регистра.
 *
 *   toast.error(t(apiErrorKey(error, SHOW_ERRORS) ?? 'common:state.error'));
 */
export function apiErrorKey(error: unknown, keys: Readonly<Record<string, string>>): string | null {
  if (!error) return null;
  const code = getErrorMessage(error).trim().toLowerCase();
  return keys[code] ?? null;
}

/**
 * i18n-ключ сообщения об ошибке API для тоста. Код бэкенда из карты →
 * перевод; иначе общий текст по статусу (422/403/404/429/5xx/сеть) или
 * fallback. Сырой текст ошибки пользователю не показываем никогда
 * (ревью 2026-10-09, FE-14/FE-15):
 *
 *   toast.error(t(apiErrorMessageKey(error, KENNEL_ERRORS, 'toast.saveFailed')));
 */
export function apiErrorMessageKey(
  error: unknown,
  keys: Readonly<Record<string, string>>,
  fallbackKey: string
): string {
  const known = apiErrorKey(error, keys);
  if (known) return known;
  if (!error) return fallbackKey;

  const status = (error as { status?: number }).status;
  if (status === 422) return 'common:errors.validation';
  if (status === 403) return 'common:errors.forbidden';
  if (status === 404) return 'common:errors.notFound';
  if (status === 429) return 'common:errors.tooManyRequests';
  if (status !== undefined && status >= 500) return 'common:errors.server';
  if (status === undefined && /network error|timeout/i.test(getErrorMessage(error))) {
    return 'common:errors.network';
  }
  return fallbackKey;
}

/** Ресурс действительно не найден (404), а не сбой сервера или сети (FE-16). */
export function isNotFoundError(error: unknown): boolean {
  return (error as { status?: number } | null | undefined)?.status === 404;
}
