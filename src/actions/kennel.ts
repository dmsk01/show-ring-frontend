import type { SWRConfiguration } from 'swr';
import type { IKennelItem, IKennelPage, IKennelCreate, IKennelUpdate } from 'src/types/kennel';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export type KennelsQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  city?: string;
  sort_by?: 'name' | 'created_at';
  order?: 'asc' | 'desc';
};

// ----------------------------------------------------------------------

// Backend GET /kennels returns a bare array (no pagination wrapper), unlike
// Dogs/Litters which return { items, meta }. Normalize both shapes defensively
// so the list keeps working whichever the backend sends.
export function normalizeKennelsResponse(
  data: IKennelItem[] | IKennelPage | undefined
): { items: IKennelItem[]; total: number } {
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }
  const items = data?.items ?? [];
  return { items, total: data?.meta?.total ?? items.length };
}

export function useGetKennelsList(query: KennelsQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '')
  );
  const key: [string, { params: Record<string, unknown> }] = [endpoints.kennel.list, { params }];

  const { data, isLoading, error, isValidating } = useSWR<IKennelItem[] | IKennelPage>(
    key,
    fetcher,
    swrOptions
  );

  return useMemo(() => {
    const { items, total } = normalizeKennelsResponse(data);
    return {
      kennels: items,
      kennelsTotal: total,
      kennelsLoading: isLoading,
      kennelsError: error,
      kennelsValidating: isValidating,
      kennelsEmpty: !isLoading && !isValidating && items.length === 0,
    };
  }, [data, error, isLoading, isValidating]);
}

// ----------------------------------------------------------------------

export function useGetKennel(kennelId?: string) {
  const key = kennelId ? endpoints.kennel.details(kennelId) : null;

  const { data, isLoading, error } = useSWR<IKennelItem>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ kennel: data, kennelLoading: isLoading, kennelError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

const revalidateList = () =>
  mutate((key) => Array.isArray(key) && key[0] === endpoints.kennel.list);

export async function createKennel(payload: IKennelCreate): Promise<IKennelItem> {
  const res = await axios.post<IKennelItem>(endpoints.kennel.list, payload);
  await revalidateList();
  return res.data;
}

export async function updateKennel(kennelId: string, payload: IKennelUpdate): Promise<IKennelItem> {
  const res = await axios.put<IKennelItem>(endpoints.kennel.details(kennelId), payload);
  await mutate(endpoints.kennel.details(kennelId));
  await revalidateList();
  return res.data;
}

export async function deleteKennel(kennelId: string): Promise<void> {
  await axios.delete(endpoints.kennel.details(kennelId));
  await revalidateList();
}
