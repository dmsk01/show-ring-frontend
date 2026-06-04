import { getErrorMessage } from 'src/auth/utils/error-message';

// ----------------------------------------------------------------------
// Бэкенд (Этап 19) отдаёт машиночитаемый код в FastAPI `detail`; axios-
// интерсептор (src/lib/axios.ts) сводит ответ к Error(detail), поэтому
// error.message === код. Переводим известные коды в RU; иначе — как есть.

const ACCOUNT_ERROR_MESSAGES: Record<string, string> = {
  current_password_invalid: 'Неверный текущий пароль',
  email_taken: 'Этот email уже занят',
  password_same_as_current: 'Новый пароль совпадает с текущим',
  invalid_or_expired_token: 'Ссылка недействительна или устарела',
};

export function accountErrorMessage(error: unknown): string {
  const raw = getErrorMessage(error);
  return ACCOUNT_ERROR_MESSAGES[raw] ?? raw;
}
