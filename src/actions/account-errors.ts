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

// Незнакомый машинный код (snake_case, без пробелов) — это внутренний
// идентификатор бэкенда, юзеру его показывать нельзя. Человекочитаемый текст
// (есть пробел/не латиница — напр. сетевые ошибки axios) пропускаем как есть.
const MACHINE_CODE = /^[a-z][a-z0-9_]*$/;
const GENERIC_ERROR = 'Не удалось выполнить операцию. Попробуйте позже.';

export function accountErrorMessage(error: unknown): string {
  const raw = getErrorMessage(error);
  if (raw in ACCOUNT_ERROR_MESSAGES) return ACCOUNT_ERROR_MESSAGES[raw];
  return MACHINE_CODE.test(raw) ? GENERIC_ERROR : raw;
}
