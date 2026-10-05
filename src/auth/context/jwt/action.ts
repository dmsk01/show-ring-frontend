'use client';

import axios, { endpoints } from 'src/lib/axios';

import { solveCaptcha } from '../../captcha';
import { getErrorMessage } from '../../utils/error-message';

// ----------------------------------------------------------------------

export type SignInParams = { email: string; password: string };

// Cookie-режим: бэкенд кладёт access/refresh в httpOnly-куки (тело — null).
// Фронт ничего не хранит сам — браузер шлёт куки автоматически (withCredentials
// в src/lib/axios.ts).

/**
 * Sign in — POST /auth/login. Бэкенд ставит httpOnly-куки сессии в ответе.
 *
 * После нескольких неудачных попыток бэкенд требует капчу (400
 * captcha_required) — решаем невидимую задачу и повторяем запрос один раз.
 * Пользователь видит только чуть более долгую загрузку кнопки.
 */
export const signInWithPassword = async ({ email, password }: SignInParams): Promise<void> => {
  try {
    await axios.post(endpoints.auth.signIn, { email, password });
  } catch (error) {
    if (getErrorMessage(error) !== 'captcha_required') throw error;
    const captcha = await solveCaptcha();
    await axios.post(endpoints.auth.signIn, { email, password, captcha });
  }
};

// Регистрации по email (POST /auth/register) на фронте нет: регистрироваться
// можно только по телефону. На бэкенде email-регистрация закрыта флагом
// AUTH_EMAIL_REGISTRATION_ENABLED (оставлен для отката).

/**
 * Вход/регистрация по телефону, шаг 1 — POST /auth/send-code. Бэкенд шлёт SMS
 * с одноразовым кодом; ответ одинаков для нового и существующего номера.
 */
export const sendPhoneCode = async (phone: string): Promise<void> => {
  // Каждое SMS стоит денег — бэкенд требует решённую капчу на каждую
  // отправку (план защиты 2026-10-05). Решение одноразовое.
  const captcha = await solveCaptcha();
  await axios.post(endpoints.auth.sendCode, { phone, captcha });
};

/**
 * Вход/регистрация по телефону, шаг 2 — POST /auth/verify-code. Бэкенд ставит
 * httpOnly-куки сессии; неизвестный номер создаёт аккаунт (isNewUser=true).
 *
 * accept_terms — нажатие кнопки под текстом «Продолжая, вы принимаете
 * Соглашение» (акцепт конклюдентным действием, п. 3 ст. 438 ГК РФ).
 * personal_data_consent — отдельная отметка в форме: с 01.09.2025 согласие
 * на обработку ПДн оформляется отдельно от иных документов (ч. 1 ст. 9
 * 152-ФЗ). Без неё бэкенд не создаст новый аккаунт (400 consent_required).
 */
export const verifyPhoneCode = async (
  phone: string,
  code: string,
  personalDataConsent = false
): Promise<{ isNewUser: boolean }> => {
  const res = await axios.post<{ is_new_user?: boolean }>(endpoints.auth.verifyCode, {
    phone,
    code,
    accept_terms: true,
    personal_data_consent: personalDataConsent,
  });
  return { isNewUser: !!res.data?.is_new_user };
};

/** Sign out — POST /auth/logout. Бэкенд всегда чистит обе куки; тело не нужно. */
export const signOut = async (): Promise<void> => {
  try {
    await axios.post(endpoints.auth.logout, {});
  } catch {
    // ignore network/401 on logout — куки бэкенд всё равно удаляет
  }
};

/**
 * Сценарий «бэкенд отозвал все refresh-токены» (смена пароля / подтверждение
 * смены email): серверная сессия уже мертва. Дёргаем logout (чистит куки) И
 * синхронизируем React-контекст, иначе state.user останется «авторизованным»
 * до перезагрузки и пользователя молча выкинет при ближайшем refresh.
 */
export const resetRevokedSession = async (
  checkUserSession?: () => Promise<void>
): Promise<void> => {
  await signOut();
  await checkUserSession?.();
};
