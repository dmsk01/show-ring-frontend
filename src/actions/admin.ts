import type { SWRConfiguration } from 'swr';
import type { Role } from 'src/types/permissions';
import type { IAdminUser, IKennelModeration, IClassifiedModeration } from 'src/types/admin';

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

export function useGetAdminUsers() {
  const key: [string, { params: { per_page: number } }] = [
    endpoints.admin.users,
    { params: { per_page: 100 } },
  ];
  const { data, isLoading, error } = useSWR<IAdminUser[]>(key, fetcher, swrOptions);
  return useMemo(
    () => ({ users: data ?? [], usersLoading: isLoading, usersError: error }),
    [data, error, isLoading]
  );
}

export async function setUserBlock(id: string, isActive: boolean): Promise<void> {
  await axios.put(endpoints.admin.userBlock(id), { is_active: isActive });
  await mutate((key) => Array.isArray(key) && key[0] === endpoints.admin.users);
}

export async function setUserRole(id: string, role: Role, grant: boolean): Promise<void> {
  await axios.put(endpoints.admin.userRole(id), { role, grant });
  await mutate((key) => Array.isArray(key) && key[0] === endpoints.admin.users);
}

// ----------------------------------------------------------------------

export function useGetModerationClassifieds() {
  const { data, isLoading } = useSWR<IClassifiedModeration[]>(
    endpoints.admin.moderationClassifieds,
    fetcher,
    swrOptions
  );
  return useMemo(() => ({ items: data ?? [], loading: isLoading }), [data, isLoading]);
}

export async function decideClassified(id: string, approve: boolean, reason?: string): Promise<void> {
  await axios.put(endpoints.admin.moderationClassified(id), { approve, reason: reason ?? null });
  await mutate(endpoints.admin.moderationClassifieds);
}

export function useGetModerationKennels() {
  const { data, isLoading } = useSWR<IKennelModeration[]>(
    endpoints.admin.moderationKennels,
    fetcher,
    swrOptions
  );
  return useMemo(() => ({ items: data ?? [], loading: isLoading }), [data, isLoading]);
}

export async function verifyKennel(id: string, isVerified: boolean): Promise<void> {
  await axios.put(endpoints.admin.kennelVerify(id), { is_verified: isVerified });
  await mutate(endpoints.admin.moderationKennels);
}
