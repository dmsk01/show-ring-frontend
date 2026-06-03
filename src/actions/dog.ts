import type { SWRConfiguration } from 'swr';
import type {
  IDogPage,
  IDogItem,
  IDogTitle,
  IDogCreate,
  IDogUpdate,
  IPedigreeNode,
} from 'src/types/dog';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export type DogsQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  breed_id?: string;
  kennel_id?: string;
  litter_id?: string;
  sex?: string;
  sort_by?: 'name' | 'date_of_birth' | 'created_at';
  order?: 'asc' | 'desc';
};

// ----------------------------------------------------------------------

export function useGetDogs(query: DogsQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all')
  );
  const key: [string, { params: Record<string, unknown> }] = [endpoints.dog.list, { params }];

  const { data, isLoading, error, isValidating } = useSWR<IDogPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      dogs: data?.items ?? [],
      dogsTotal: data?.total ?? 0,
      dogsLoading: isLoading,
      dogsError: error,
      dogsValidating: isValidating,
      dogsEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export function useGetDog(dogId?: string) {
  const key = dogId ? endpoints.dog.details(dogId) : null;

  const { data, isLoading, error, isValidating } = useSWR<IDogItem>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ dog: data, dogLoading: isLoading, dogError: error, dogValidating: isValidating }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export function useGetDogTitles(dogId?: string) {
  const key = dogId ? endpoints.dog.titles(dogId) : null;

  const { data, isLoading, error } = useSWR<IDogTitle[]>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ titles: data ?? [], titlesLoading: isLoading, titlesError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

export function useGetDogPedigree(dogId?: string) {
  const key = dogId ? endpoints.dog.pedigree(dogId) : null;

  const { data, isLoading, error } = useSWR<IPedigreeNode>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ pedigree: data, pedigreeLoading: isLoading, pedigreeError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

export async function createDog(payload: IDogCreate): Promise<IDogItem> {
  const res = await axios.post<IDogItem>(endpoints.dog.list, payload);
  await mutate((key) => Array.isArray(key) && key[0] === endpoints.dog.list);
  return res.data;
}

export async function updateDog(dogId: string, payload: IDogUpdate): Promise<IDogItem> {
  const res = await axios.put<IDogItem>(endpoints.dog.details(dogId), payload);
  await mutate(endpoints.dog.details(dogId));
  await mutate((key) => Array.isArray(key) && key[0] === endpoints.dog.list);
  return res.data;
}
