import type { SWRConfiguration } from 'swr';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export type IUserRole = { role: string; granted_at?: string };

export type IMe = {
  id: string;
  email: string;
  is_active: boolean;
  is_email_verified: boolean;
  roles: IUserRole[];
  created_at: string;
};

export type IUserProfile = {
  first_name: string | null;
  last_name: string | null;
  patronymic: string | null;
  country: string | null;
};

// ----------------------------------------------------------------------

export function useGetMe() {
  const { data, isLoading, error } = useSWR<IMe>(endpoints.auth.me, fetcher, swrOptions);
  return useMemo(() => ({ me: data, meLoading: isLoading, meError: error }), [data, isLoading, error]);
}

export function useGetMyProfile() {
  const { data, isLoading, error } = useSWR<IUserProfile>(
    endpoints.auth.profile,
    fetcher,
    swrOptions
  );
  return useMemo(
    () => ({ profile: data, profileLoading: isLoading, profileError: error }),
    [data, isLoading, error]
  );
}

export async function updateMyProfile(payload: Partial<IUserProfile>): Promise<IUserProfile> {
  const res = await axios.patch<IUserProfile>(endpoints.auth.profile, payload);
  await mutate(endpoints.auth.profile);
  return res.data;
}

// ----------------------------------------------------------------------

export type IUserEmailUpdate = {
  email: string;
  current_password: string;
};

export type IUserPasswordUpdate = {
  current_password: string;
  new_password: string;
};

export type IMessageResponse = { message: string };

// PUT /users/me — запрос смены email. Email НЕ меняется сразу: бэкенд пишет
// pending_email и шлёт письмо. Поэтому me НЕ мутируем — текущий email прежний.
export async function updateMyEmail(payload: IUserEmailUpdate): Promise<IMessageResponse> {
  const res = await axios.put<IMessageResponse>(endpoints.auth.me, payload);
  return res.data;
}

// PUT /users/me/password — смена пароля (re-auth текущим паролем). Бэкенд
// отзывает все refresh-токены.
export async function updateMyPassword(
  payload: IUserPasswordUpdate
): Promise<IMessageResponse> {
  const res = await axios.put<IMessageResponse>(endpoints.auth.password, payload);
  return res.data;
}

// POST /auth/confirm-email-change — подтверждение смены email по токену из
// письма: pending_email → email, отзыв refresh-токенов.
export async function confirmEmailChange(token: string): Promise<IMessageResponse> {
  const res = await axios.post<IMessageResponse>(endpoints.auth.confirmEmailChange, { token });
  return res.data;
}
