import type { SWRConfiguration } from 'swr';
import type {
  IShowEntry,
  IShowEntryCreate,
  IShowEntryUpdate,
  IAvailableClasses,
} from 'src/types/show-entry';

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
  // Ключ агрегата — массив [url, {params}]; вьюха в этот момент размонтирована,
  // поэтому чистим кэш (data=undefined, revalidate=false) — remount перезапросит.
  await mutate((key) => Array.isArray(key) && key[0] === endpoints.show.myShowsList, undefined, {
    revalidate: false,
  });
  return res.data;
}

// ----------------------------------------------------------------------

export async function updateShowEntry(
  showId: string,
  entryId: string,
  payload: IShowEntryUpdate
): Promise<IShowEntry> {
  const res = await axios.patch<IShowEntry>(endpoints.show.entryItem(showId, entryId), payload);
  await mutate(endpoints.show.myEntries(showId));
  // Ключ агрегата — массив [url, {params}]; вьюха в этот момент размонтирована,
  // поэтому чистим кэш (data=undefined, revalidate=false) — remount перезапросит.
  await mutate((key) => Array.isArray(key) && key[0] === endpoints.show.myShowsList, undefined, {
    revalidate: false,
  });
  return res.data;
}

export async function deleteShowEntry(showId: string, entryId: string): Promise<void> {
  await axios.delete(endpoints.show.entryItem(showId, entryId));
  await mutate(endpoints.show.myEntries(showId));
  // Чистим кэш агрегата (вьюха размонтирована) — remount перезапросит.
  await mutate((key) => Array.isArray(key) && key[0] === endpoints.show.myShowsList, undefined, {
    revalidate: false,
  });
}
