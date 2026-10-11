import type { SWRConfiguration } from 'swr';
import type {
  IShowRing,
  IShowResult,
  IShowEntryRow,
  IShowEntryPage,
  IShowResultCreate,
  IShowResultUpdate,
} from 'src/types/show-result';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { useReferenceList } from 'src/actions/admin-reference';
import axios, { fetcher, ALL_PAGES, endpoints, allPagesFetcher } from 'src/lib/axios';

import { buildResultRows, referencesFromEntryRows } from 'src/sections/show/show-results-utils';

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

// ----------------------------------------------------------------------

export function useGetShowRings(showId?: string) {
  const key = showId ? endpoints.show.rings(showId) : null;
  const { data, isLoading, error } = useSWR<IShowRing[]>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ rings: data ?? [], ringsLoading: isLoading, ringsError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

/**
 * Записи выставки с кличкой, породой, питомником и классом — все страницы
 * GET /shows/{id}/entries/table (ревью 2026-10-09, FE-08).
 */
export function useShowEntryRows(showId?: string) {
  const key = showId ? ([endpoints.show.entriesTable(showId), ALL_PAGES] as const) : null;
  const { data, isLoading, error } = useSWR<IShowEntryRow[]>(
    key,
    allPagesFetcher<IShowEntryRow>,
    swrOptions
  );
  return useMemo(
    () => ({ entryRows: data ?? [], entryRowsLoading: isLoading, entryRowsError: error }),
    [data, error, isLoading]
  );
}

/** Строки таблицы результатов (кабинет и публичная страница). */
export function useShowResultRows(showId?: string) {
  // Кличка/порода/питомник/класс приходят в строках записей с сервера —
  // раньше их склеивали с первой страницей /dogs, и гостю (50 собак всей
  // базы) таблица показывала «—» (FE-08). Справочники — только групп и оценок.
  const { entryRows, entryRowsLoading } = useShowEntryRows(showId);
  const { results, resultsLoading } = useGetShowResults(showId);
  const { rings } = useGetShowRings(showId);
  const { items: breedGroups } = useReferenceList('/references/breed-groups');
  const { items: grades } = useReferenceList('/references/grades');

  const rows = useMemo(
    () =>
      buildResultRows({
        ...referencesFromEntryRows(entryRows),
        entries: entryRows,
        results,
        breedGroups: breedGroups as never,
        grades,
        rings,
      }),
    [entryRows, results, breedGroups, grades, rings]
  );

  return {
    rows,
    loading: entryRowsLoading || resultsLoading,
    isEmpty: !entryRowsLoading && entryRows.length === 0,
  };
}
