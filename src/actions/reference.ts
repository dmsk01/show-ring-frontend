import type { SWRConfiguration } from 'swr';
import type { IBreed, IKennel, IBreedPage, IKennelPage } from 'src/types/reference';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// Reference lists are small and rarely change — fetch a large page once for selects.
const LIST_PARAMS = { params: { per_page: 200 } };

// ----------------------------------------------------------------------

export function useGetBreeds() {
  const key: [string, typeof LIST_PARAMS] = [endpoints.reference.breeds, LIST_PARAMS];

  const { data, isLoading, error } = useSWR<IBreedPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      breeds: (data?.items ?? []) as IBreed[],
      breedsLoading: isLoading,
      breedsError: error,
    }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

export function useGetKennels() {
  const key: [string, typeof LIST_PARAMS] = [endpoints.reference.kennels, LIST_PARAMS];

  const { data, isLoading, error } = useSWR<IKennelPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      kennels: (data?.items ?? []) as IKennel[],
      kennelsLoading: isLoading,
      kennelsError: error,
    }),
    [data, error, isLoading]
  );
}
