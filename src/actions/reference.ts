import type { SWRConfiguration } from 'swr';
import type { IBreed, IKennel } from 'src/types/reference';

import useSWR from 'swr';
import { useMemo } from 'react';

import { ALL_PAGES, endpoints, allPagesFetcher } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// Справочники редко меняются, но они длиннее одной страницы (пород FCI 362
// при максимуме 200) — собираем все страницы (ревью 2026-10-09, FE-07).

// ----------------------------------------------------------------------

export function useGetBreeds() {
  const key: [string, typeof ALL_PAGES] = [endpoints.reference.breeds, ALL_PAGES];

  const { data, isLoading, error } = useSWR<IBreed[]>(key, allPagesFetcher<IBreed>, swrOptions);

  return useMemo(
    () => ({
      breeds: data ?? [],
      breedsLoading: isLoading,
      breedsError: error,
    }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

export function useGetKennels() {
  const key: [string, typeof ALL_PAGES] = [endpoints.reference.kennels, ALL_PAGES];

  // allPagesFetcher принимает и страницу { items, total }, и голый массив.
  const { data, isLoading, error } = useSWR<IKennel[]>(key, allPagesFetcher<IKennel>, swrOptions);

  return useMemo(
    () => ({
      kennels: data ?? [],
      kennelsLoading: isLoading,
      kennelsError: error,
    }),
    [data, error, isLoading]
  );
}
