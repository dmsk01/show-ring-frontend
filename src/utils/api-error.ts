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
