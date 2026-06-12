'use client';

import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export type SignInParams = { email: string; password: string };
export type SignUpParams = { email: string; password: string };

// Cookie-режим: бэкенд кладёт access/refresh в httpOnly-куки (тело — null).
// Фронт ничего не хранит сам — браузер шлёт куки автоматически (withCredentials
// в src/lib/axios.ts).

/** Sign in — POST /auth/login. Бэкенд ставит httpOnly-куки сессии в ответе. */
export const signInWithPassword = async ({ email, password }: SignInParams): Promise<void> => {
  await axios.post(endpoints.auth.signIn, { email, password });
};

/**
 * Sign up — POST /auth/register. НЕ логинит пользователя: бэкенд создаёт аккаунт
 * и шлёт письмо для подтверждения email (ответ { message }, без токенов/кук).
 * Вьюха после успеха ведёт на /sign-in с уведомлением «проверьте почту».
 */
export const signUp = async ({ email, password }: SignUpParams): Promise<string | undefined> => {
  const res = await axios.post<{ message?: string }>(endpoints.auth.signUp, { email, password });
  return res.data?.message;
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
