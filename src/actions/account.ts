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
