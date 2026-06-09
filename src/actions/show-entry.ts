import type { SWRConfiguration } from 'swr';
import type { IShowEntry, IShowEntryCreate, IAvailableClasses } from 'src/types/show-entry';

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

/** Записи текущего пользователя на эту выставку. */
export function useMyShowEntries(showId?: string) {
  const key = showId ? endpoints.show.myEntries(showId) : null;

  const { data, isLoading, error } = useSWR<IShowEntry[]>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ entries: data ?? [], entriesLoading: isLoading, entriesError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

/** Классы, доступные собаке по возрасту на дату выставки. */
export function useAvailableClasses(showId?: string, dogId?: string) {
  const key = showId && dogId ? endpoints.show.availableClasses(showId, dogId) : null;

  const { data, isLoading, error } = useSWR<IAvailableClasses>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      classes: data?.classes ?? [],
      ageMonths: data?.age_at_show_months ?? null,
      classesLoading: isLoading,
      classesError: error,
    }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

export async function createShowEntry(
  showId: string,
  payload: IShowEntryCreate
): Promise<IShowEntry> {
  const res = await axios.post<IShowEntry>(endpoints.show.entries(showId), payload);
  await mutate(endpoints.show.myEntries(showId));
  return res.data;
}
