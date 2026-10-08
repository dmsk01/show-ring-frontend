import type { SWRConfiguration } from 'swr';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------
// Журнал согласий (152-ФЗ) и удаление аккаунта. Бэкенд:
// app/routers/users.py — /users/me/consents, /users/me/delete.

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

/** Согласия уровня аккаунта; публикационные даются переключателем у публикации. */
export type AccountConsentKind = 'terms' | 'personal_data';

export type IConsentItem = {
  kind: string;
  revision: string;
  target_id: string | null;
  granted_at: string;
};

export type IConsents = {
  active: IConsentItem[];
  /** Обязательные согласия, которых нет в актуальной редакции документов. */
  missing: AccountConsentKind[];
};

export function useGetMyConsents(enabled = true) {
  const { data, isLoading, error } = useSWR<IConsents>(
    enabled ? endpoints.auth.consents : null,
    fetcher,
    swrOptions
  );
  return useMemo(
    () => ({ consents: data, consentsLoading: isLoading, consentsError: error }),
    [data, isLoading, error]
  );
}

export async function grantConsents(kinds: AccountConsentKind[]): Promise<IConsents> {
  const res = await axios.post<IConsents>(endpoints.auth.consents, { kinds });
  await mutate(endpoints.auth.consents, res.data, false);
  return res.data;
}

/** Отзыв согласия на обработку ПДн (ч. 2 ст. 9 152-ФЗ). */
export async function revokePersonalDataConsent(): Promise<IConsents> {
  const res = await axios.delete<IConsents>(`${endpoints.auth.consents}/personal_data`);
  await mutate(endpoints.auth.consents, res.data, false);
  return res.data;
}

export type IAccountDelete = { code?: string; password?: string };

/** Обезличивание аккаунта. После успеха сессия на бэкенде уже недействительна. */
export async function deleteMyAccount(payload: IAccountDelete): Promise<void> {
  await axios.post(endpoints.auth.deleteAccount, payload);
}
