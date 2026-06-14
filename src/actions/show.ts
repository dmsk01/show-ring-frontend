import type { SWRConfiguration } from 'swr';
import type { IShowItem, IShowPage, ShowStatus, IShowCreate, IShowUpdate } from 'src/types/show';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export type ShowsQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  rank_id?: string;
  city?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'date_start' | 'created_at';
  order?: 'asc' | 'desc';
};

// ----------------------------------------------------------------------

export function useGetShows(query: ShowsQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all')
  );
  const key: [string, { params: Record<string, unknown> }] = [endpoints.show.list, { params }];

  const { data, isLoading, error, isValidating } = useSWR<IShowPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      shows: data?.items ?? [],
      showsTotal: data?.total ?? 0,
      showsLoading: isLoading,
      showsError: error,
      showsEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export function useGetShow(showId?: string) {
  const key = showId ? endpoints.show.details(showId) : null;

  const { data, isLoading, error } = useSWR<IShowItem>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ show: data, showLoading: isLoading, showError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

const revalidateList = () =>
  mutate((key) => Array.isArray(key) && key[0] === endpoints.show.list);

export async function createShow(payload: IShowCreate): Promise<IShowItem> {
  const res = await axios.post<IShowItem>(endpoints.show.list, payload);
  await revalidateList();
  return res.data;
}

export async function updateShow(id: string, payload: IShowUpdate): Promise<IShowItem> {
  const res = await axios.put<IShowItem>(endpoints.show.details(id), payload);
  await mutate(endpoints.show.details(id));
  await revalidateList();
  return res.data;
}

export async function setShowStatus(id: string, status: ShowStatus): Promise<void> {
  await axios.put(endpoints.show.status(id), { status });
  await mutate(endpoints.show.details(id));
  await revalidateList();
}

export async function publishShow(id: string): Promise<void> {
  await axios.post(endpoints.show.publish(id));
  await mutate(endpoints.show.details(id));
  await revalidateList();
}
