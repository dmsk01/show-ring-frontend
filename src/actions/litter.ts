import type { SWRConfiguration } from 'swr';
import type { IDogItem } from 'src/types/dog';
import type { ILitterItem, ILitterPage, ILitterCreate, ILitterUpdate } from 'src/types/litter';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export type LittersQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  kennel_id?: string;
  breed_id?: string;
  status?: string;
};

// ----------------------------------------------------------------------

export function useGetLittersList(query: LittersQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all')
  );
  const key: [string, { params: Record<string, unknown> }] = [endpoints.litter.list, { params }];

  const { data, isLoading, error, isValidating } = useSWR<ILitterPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      litters: data?.items ?? [],
      littersTotal: data?.total ?? 0,
      littersLoading: isLoading,
      littersError: error,
      littersValidating: isValidating,
      littersEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export function useGetLitter(litterId?: string) {
  const key = litterId ? endpoints.litter.details(litterId) : null;

  const { data, isLoading, error } = useSWR<ILitterItem>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ litter: data, litterLoading: isLoading, litterError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

export function useGetLitterPuppies(litterId?: string) {
  const key = litterId ? endpoints.litter.puppies(litterId) : null;

  const { data, isLoading, error } = useSWR<IDogItem[]>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      puppies: data ?? [],
      puppiesLoading: isLoading,
      puppiesError: error,
    }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

const revalidateList = () =>
  mutate((key) => Array.isArray(key) && key[0] === endpoints.litter.list);

export async function createLitter(payload: ILitterCreate): Promise<ILitterItem> {
  const res = await axios.post<ILitterItem>(endpoints.litter.list, payload);
  await revalidateList();
  return res.data;
}

export async function updateLitter(litterId: string, payload: ILitterUpdate): Promise<ILitterItem> {
  const res = await axios.put<ILitterItem>(endpoints.litter.details(litterId), payload);
  await mutate(endpoints.litter.details(litterId));
  await revalidateList();
  return res.data;
}
