import type { SWRConfiguration } from 'swr';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------
// Реестр способов входа (GET /auth/methods). Экраны входа/регистрации рисуются
// по нему, а не по захардкоженному списку: новый способ (VK ID, Telegram…)
// добавляется на бэкенде без правок экранов.

export type AuthMethodId = 'phone_otp' | 'email_password' | (string & {});

export type AuthMethod = { id: AuthMethodId; sign_in: boolean; sign_up: boolean };

export type AuthMethods = {
  primary: AuthMethodId;
  phone_required: boolean;
  methods: AuthMethod[];
};

// Дефолт совпадает с бэкендовым: экран рисуется сразу, без мигания, а ответ
// сервера лишь уточняет его (например, если email-вход выключен).
export const DEFAULT_AUTH_METHODS: AuthMethods = {
  primary: 'phone_otp',
  phone_required: true,
  methods: [
    { id: 'phone_otp', sign_in: true, sign_up: true },
    { id: 'email_password', sign_in: true, sign_up: false },
  ],
};

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function useAuthMethods() {
  const { data } = useSWR<AuthMethods>(endpoints.auth.methods, fetcher, swrOptions);

  return useMemo(() => {
    const value = data ?? DEFAULT_AUTH_METHODS;
    const find = (id: AuthMethodId) => value.methods.find((m) => m.id === id);
    return {
      ...value,
      canSignIn: (id: AuthMethodId) => !!find(id)?.sign_in,
      canSignUp: (id: AuthMethodId) => !!find(id)?.sign_up,
    };
  }, [data]);
}
