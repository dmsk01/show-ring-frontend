import { apiErrorMessageKey } from 'src/utils/api-error';

// ----------------------------------------------------------------------
// Бэкенд (Этап 19) отдаёт машиночитаемый код в FastAPI `detail`; axios-
// интерсептор (src/lib/axios.ts) сводит ответ к Error(detail), поэтому
// error.message === код. Известные коды → i18n-ключи; остальное — общий
// текст по статусу (apiErrorMessageKey). Сырой текст не показываем
// (ревью 2026-10-09, FE-15/FE-27).

const ACCOUNT_ERRORS: Record<string, string> = {
  current_password_invalid: 'account:errors.currentPasswordInvalid',
  email_taken: 'account:errors.emailTaken',
  password_same_as_current: 'account:errors.passwordSameAsCurrent',
  invalid_or_expired_token: 'account:errors.invalidOrExpiredToken',
};

export function accountErrorKey(error: unknown): string {
  return apiErrorMessageKey(error, ACCOUNT_ERRORS, 'account:errors.generic');
}
