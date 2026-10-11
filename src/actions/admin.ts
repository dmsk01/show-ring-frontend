import type { SWRConfiguration } from 'swr';
import type { Role } from 'src/types/permissions';
import type {
  IAdminUser,
  IKennelModeration,
  ICampaignModeration,
  IClassifiedModeration,
} from 'src/types/admin';

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

// GET /admin/users возвращает голый массив без `total` (page/per_page до 200).
// Тянем максимальную страницу, чтобы список не обрезался молча на меньшем пределе.
// TODO: настоящая server-side пагинация (page/per_page + UI) появится, когда бэкенд
// начнёт отдавать `total` в обёртке {items,total,page,per_page} — тогда per_page 200
// заменить на постраничную навигацию через TablePaginationCustom.
export function useGetAdminUsers() {
  const key: [string, { params: { per_page: number } }] = [
    endpoints.admin.users,
    { params: { per_page: 200 } },
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

// Модерационные очереди — тот же голый массив без `total` (см. useGetAdminUsers).
// Тянем максимальную страницу бэкенда (200), чтобы очередь не обрезалась молча.
export function useGetModerationClassifieds() {
  const key: [string, { params: { per_page: number } }] = [
    endpoints.admin.moderationClassifieds,
    { params: { per_page: 200 } },
  ];
  const { data, isLoading } = useSWR<IClassifiedModeration[]>(key, fetcher, swrOptions);
  return useMemo(() => ({ items: data ?? [], loading: isLoading }), [data, isLoading]);
}

export async function decideClassified(id: string, approve: boolean, reason?: string): Promise<void> {
  await axios.put(endpoints.admin.moderationClassified(id), { approve, reason: reason ?? null });
  // Ключ — массив [url, {params}]: ревалидируем по предикату, а не по строке.
  await mutate((key) => Array.isArray(key) && key[0] === endpoints.admin.moderationClassifieds);
}

/** Кампании, ждущие первого одобрения админом (FE-37). */
export function useGetModerationCampaigns() {
  const key: [string, { params: { per_page: number } }] = [
    endpoints.admin.moderationCampaigns,
    { params: { per_page: 200 } },
  ];
  const { data, isLoading } = useSWR<ICampaignModeration[]>(key, fetcher, swrOptions);
  return useMemo(() => ({ items: data ?? [], loading: isLoading }), [data, isLoading]);
}

/** Одобрить (запуск в показ) или отклонить кампанию. */
export async function decideCampaign(id: string, approve: boolean, reason?: string): Promise<void> {
  await axios.put(endpoints.admin.moderationCampaign(id), { approve, reason: reason ?? null });
  await mutate((key) => Array.isArray(key) && key[0] === endpoints.admin.moderationCampaigns);
  // Статус и бейдж «На модерации» в списке кампаний.
  await mutate(endpoints.ad.campaigns);
}

export function useGetModerationKennels() {
  const key: [string, { params: { per_page: number } }] = [
    endpoints.admin.moderationKennels,
    { params: { per_page: 200 } },
  ];
  const { data, isLoading } = useSWR<IKennelModeration[]>(key, fetcher, swrOptions);
  return useMemo(() => ({ items: data ?? [], loading: isLoading }), [data, isLoading]);
}

export async function verifyKennel(id: string, isVerified: boolean): Promise<void> {
  await axios.put(endpoints.admin.kennelVerify(id), { is_verified: isVerified });
  await mutate((key) => Array.isArray(key) && key[0] === endpoints.admin.moderationKennels);
}
