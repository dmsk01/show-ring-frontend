import type { SWRConfiguration } from 'swr';
import type {
  IClassifiedItem,
  IClassifiedPage,
  ClassifiedStatus,
  IClassifiedCreate,
  IClassifiedUpdate,
  AnimalAvailability,
} from 'src/types/classified';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export type ClassifiedsQuery = {
  page?: number;
  per_page?: number;
  category?: string;
  breed_id?: string;
  sex?: 'male' | 'female';
  city?: string;
  status?: ClassifiedStatus;
  availability?: AnimalAvailability;
  price_from?: number;
  price_to?: number;
  sort_by?: 'created_at' | 'price' | 'views_count';
  order?: 'asc' | 'desc';
};

// ----------------------------------------------------------------------

export function useGetClassifieds(query: ClassifiedsQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all')
  );
  const key: [string, { params: Record<string, unknown> }] = [endpoints.classified.list, { params }];

  const { data, isLoading, error, isValidating } = useSWR<IClassifiedPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      classifieds: data?.items ?? [],
      classifiedsTotal: data?.total ?? 0,
      classifiedsLoading: isLoading,
      classifiedsError: error,
      classifiedsEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

// Current user's own classifieds across ALL statuses (dashboard management
// view). Backend `/classifieds/mine` is auth-scoped by author_id and does not
// force status=active, so deactivated/moderation/archived listings stay visible.
export function useGetMyClassifieds(query: ClassifiedsQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all')
  );
  const key: [string, { params: Record<string, unknown> }] = [endpoints.classified.mine, { params }];

  const { data, isLoading, error, isValidating } = useSWR<IClassifiedPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      classifieds: data?.items ?? [],
      classifiedsTotal: data?.total ?? 0,
      classifiedsLoading: isLoading,
      classifiedsError: error,
      classifiedsEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export function useGetClassified(classifiedId?: string) {
  const key = classifiedId ? endpoints.classified.details(classifiedId) : null;

  const { data, isLoading, error } = useSWR<IClassifiedItem>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ classified: data, classifiedLoading: isLoading, classifiedError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

// Revalidate both the public list and the dashboard "mine" list so a status /
// availability change is reflected immediately in either view.
const revalidateList = () =>
  mutate(
    (key) =>
      Array.isArray(key) &&
      (key[0] === endpoints.classified.list || key[0] === endpoints.classified.mine)
  );

export async function createClassified(payload: IClassifiedCreate): Promise<IClassifiedItem> {
  const res = await axios.post<IClassifiedItem>(endpoints.classified.list, payload);
  await revalidateList();
  return res.data;
}

export async function updateClassified(
  id: string,
  payload: IClassifiedUpdate
): Promise<IClassifiedItem> {
  const res = await axios.put<IClassifiedItem>(endpoints.classified.details(id), payload);
  await mutate(endpoints.classified.details(id));
  await revalidateList();
  return res.data;
}

export async function deleteClassified(id: string): Promise<void> {
  await axios.delete(endpoints.classified.details(id));
  await revalidateList();
}
