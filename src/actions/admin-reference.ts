import type { SWRConfiguration } from 'swr';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { ALL_PAGES, allPagesFetcher } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export type ReferenceRecord = { id: string; name: string } & Record<string, unknown>;

// Справочники собираются со всех страниц (ревью 2026-10-09, FE-07). key[0] —
// URL списка: по нему revalidate ниже находит кэш после правок.
const LIST_KEY = (url: string): [string, typeof ALL_PAGES] => [url, ALL_PAGES];

export function useReferenceList(url: string) {
  const { data, isLoading, error } = useSWR<ReferenceRecord[]>(
    LIST_KEY(url),
    allPagesFetcher<ReferenceRecord>,
    swrOptions
  );

  return useMemo(
    () => ({ items: data ?? [], loading: isLoading, error }),
    [data, isLoading, error]
  );
}

const revalidate = (listUrl: string) =>
  mutate((key) => Array.isArray(key) && key[0] === listUrl);

export async function createReference(
  adminUrl: string,
  listUrl: string,
  payload: Record<string, unknown>
) {
  await axios.post(adminUrl, payload);
  await revalidate(listUrl);
}

export async function updateReference(
  adminUrl: string,
  listUrl: string,
  id: string,
  payload: Record<string, unknown>
) {
  await axios.put(`${adminUrl}/${id}`, payload);
  await revalidate(listUrl);
}

export async function deleteReference(adminUrl: string, listUrl: string, id: string) {
  await axios.delete(`${adminUrl}/${id}`);
  await revalidate(listUrl);
}
