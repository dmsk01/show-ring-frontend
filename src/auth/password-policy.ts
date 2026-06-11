import * as z from 'zod';

// ----------------------------------------------------------------------

// Зеркало бэкендовской политики паролей (app/utils/security.py → validate_password):
// 8–128 символов И ≤72 байт в UTF-8. Ограничение в 72 байта — от bcrypt (хеширует
// только первые 72 байта; для кириллицы порог наступает уже на ~36 символах).
// Держим клиент в синхроне с сервером, чтобы валидные на вид пароли не падали на
// бэкенде. Авторитет всё равно за бэкендом — он перепроверяет независимо.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const PASSWORD_MAX_BYTES = 72;

export type PasswordPolicyMessages = {
  min: string;
  max: string;
  bytes: string;
};

/** Единое правило пароля для регистрации и смены пароля (сообщения — из локалей). */
export function passwordPolicy(messages: PasswordPolicyMessages) {
  return z
    .string()
    .min(PASSWORD_MIN, { error: messages.min })
    .max(PASSWORD_MAX, { error: messages.max })
    .refine((value) => new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES, {
      error: messages.bytes,
    });
}
