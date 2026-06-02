import type { SWRConfiguration } from 'swr';
import type {
  IShowResult,
  IShowEntryPage,
  IShowResultCreate,
  IShowResultUpdate,
} from 'src/types/show-result';

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

export function useGetShowEntries(showId?: string) {
  const key = showId
    ? ([endpoints.show.entries(showId), { params: { per_page: 200 } }] as const)
    : null;

  const { data, isLoading, error } = useSWR<IShowEntryPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ entries: data?.items ?? [], entriesLoading: isLoading, entriesError: error }),
    [data, error, isLoading]
  );
}

export function useGetShowResults(showId?: string) {
  const key = showId ? endpoints.show.results(showId) : null;

  const { data, isLoading, error } = useSWR<IShowResult[]>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ results: data ?? [], resultsLoading: isLoading, resultsError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

const revalidateResults = (showId: string) => mutate(endpoints.show.results(showId));

export async function createShowResult(
  showId: string,
  payload: IShowResultCreate
): Promise<IShowResult> {
  const res = await axios.post<IShowResult>(endpoints.show.results(showId), payload);
  await revalidateResults(showId);
  return res.data;
}

export async function updateShowResult(
  showId: string,
  resultId: string,
  payload: IShowResultUpdate
): Promise<IShowResult> {
  const res = await axios.put<IShowResult>(endpoints.show.resultItem(showId, resultId), payload);
  await revalidateResults(showId);
  return res.data;
}
