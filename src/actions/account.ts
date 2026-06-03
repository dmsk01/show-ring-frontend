import type { SWRConfiguration } from 'swr';
import type { ITicketCreate } from 'src/types/support';
import type { IUserProfile, IUserEmailUpdate, IUserProfileUpdate } from 'src/types/account';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useMyProfile(enabled = true) {
  const key = enabled ? endpoints.auth.profile : null;

  const { data, isLoading, error, isValidating } = useSWR<IUserProfile>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      profile: data,
      profileLoading: isLoading,
      profileError: error,
      profileValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export async function updateMyProfile(payload: IUserProfileUpdate): Promise<IUserProfile> {
  const res = await axios.patch<IUserProfile>(endpoints.auth.profile, payload);
  await mutate(endpoints.auth.profile);
  return res.data;
}

export async function updateMyEmail(payload: IUserEmailUpdate): Promise<void> {
  await axios.put(endpoints.auth.me, payload);
}

export async function createSupportTicket(payload: ITicketCreate): Promise<void> {
  await axios.post(endpoints.support.tickets, payload);
}
