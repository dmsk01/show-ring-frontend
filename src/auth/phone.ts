import * as z from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import { getErrorMessage } from './utils/error-message';

// ----------------------------------------------------------------------
// Телефон — основной способ входа и регистрации (OTP по SMS). Бэкенд
// принимает номер строго в E.164 (+79991234567): поле Field.Phone
// (react-phone-number-input) уже отдаёт его в этом формате.

export const OTP_CODE_LENGTH = 6;

// Совпадает с бэкендовым OTP_SEND_COOLDOWN_SECONDS: раньше повторная
// отправка всё равно вернёт 429.
export const OTP_RESEND_SECONDS = 60;

type FieldMessages = { required: string; invalid: string };

export function phoneSchema(messages: FieldMessages) {
  return z
    .string()
    .min(1, { error: messages.required })
    .refine((value) => isValidPhoneNumber(value), { error: messages.invalid });
}

export function otpCodeSchema(messages: FieldMessages) {
  return z
    .string()
    .min(1, { error: messages.required })
    .regex(new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`), { error: messages.invalid });
}

// ----------------------------------------------------------------------

// Бэкенд отдаёт машиночитаемые коды (detail) и rate-limit-строки — показывать
// их пользователю нельзя. Ключи сравниваем без учёта регистра.
const OTP_ERROR_KEYS: Record<string, string> = {
  invalid_code: 'auth:errors.invalidCode',
  code_expired: 'auth:errors.codeExpired',
  // Cooldown/суточный лимит OTP — «код уже отправлен»...
  too_many_requests: 'auth:errors.tooManyCodes',
  // ...а это IP-лимитер (progressive_ban) — общая «слишком много попыток».
  'too many requests': 'auth:errors.tooManyRequests',
  sms_delivery_failed: 'auth:errors.smsFailed',
  // Новый номер без отметки согласия (ч. 1 ст. 9 152-ФЗ) — код уже сожжён.
  consent_required: 'auth:errors.consentRequired',
  user_blocked: 'auth:errors.userBlocked',
  phone_taken: 'auth:errors.phoneTaken',
  phone_already_set: 'auth:errors.phoneAlreadySet',
  phone_not_set: 'auth:errors.phoneNotSet',
  email_taken: 'auth:errors.emailTaken',
  email_already_set: 'auth:errors.emailAlreadySet',
  login_method_disabled: 'auth:errors.methodDisabled',
  registration_method_disabled: 'auth:errors.methodDisabled',
  'rate limit subsystem unavailable': 'auth:errors.serviceUnavailable',
  'network error': 'auth:errors.network',
};

/**
 * i18n-ключ человекочитаемой ошибки для OTP-операций (вход, привязка, re-auth).
 * on422 — что показать, если Pydantic отверг тело запроса: в формах телефона
 * это номер, а в подключении почты — email или пароль.
 */
export function resolveOtpErrorKey(
  error: unknown,
  { on422 = 'auth:errors.phoneInvalid' }: { on422?: string } = {}
): string {
  // 422 — detail там массив, а не строка: по тексту не сматчить.
  if ((error as { status?: number } | null)?.status === 422) {
    return on422;
  }
  const raw = getErrorMessage(error).trim().toLowerCase();
  return OTP_ERROR_KEYS[raw] ?? 'auth:errors.generic';
}
