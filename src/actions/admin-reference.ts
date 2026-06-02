import type { SWRConfiguration } from 'swr';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export type ReferenceRecord = { id: string; name: string } & Record<string, unknown>;

type ListResponse = ReferenceRecord[] | { items?: ReferenceRecord[] };

// Reference lists are small — fetch a large page (some endpoints are paginated).
const LIST_KEY = (url: string): [string, { params: { per_page: number } }] => [
  url,
  { params: { per_page: 200 } },
];

export function useReferenceList(url: string) {
  const { data, isLoading, error } = useSWR<ListResponse>(LIST_KEY(url), fetcher, swrOptions);

  return useMemo(() => {
    const items: ReferenceRecord[] = Array.isArray(data) ? data : (data?.items ?? []);
    return { items, loading: isLoading, error };
  }, [data, isLoading, error]);
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
