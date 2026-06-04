import type { SWRConfiguration } from 'swr';
import type {
  IShowRing,
  IShowResult,
  IShowEntryPage,
  IShowResultCreate,
  IShowResultUpdate,
} from 'src/types/show-result';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { useGetDogs } from 'src/actions/dog';
import axios, { fetcher, endpoints } from 'src/lib/axios';
import { useReferenceList } from 'src/actions/admin-reference';

import { buildResultRows } from 'src/sections/show/show-results-utils';

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

/** Builds enriched, joinable result rows for a show (used by dashboard + public). */
export function useShowResultRows(showId?: string) {
  // Lists are fetched at the backend's max page size (200; per_page > 200 → 422).
  // Shows with more than 200 dogs/kennels would render "—" for the overflow rows;
  // the planned backend enrichment (embed dog/breed/kennel into /results) removes
  // these client-side joins — see the spec's future-work appendix.
  // NB: /kennels returns a bare array (not {items}), so it goes through
  // useReferenceList, which handles both array and {items} shapes.
  const { entries, entriesLoading } = useGetShowEntries(showId);
  const { results, resultsLoading } = useGetShowResults(showId);
  const { rings } = useGetShowRings(showId);
  const { dogs, dogsLoading } = useGetDogs({ per_page: 200 });
  const { items: kennels } = useReferenceList('/kennels');
  const { items: breeds } = useReferenceList('/references/breeds');
  const { items: breedGroups } = useReferenceList('/references/breed-groups');
  const { items: classes } = useReferenceList('/references/show-classes');
  const { items: grades } = useReferenceList('/references/grades');

  const rows = useMemo(
    () =>
      buildResultRows({
        entries,
        results,
        dogs,
        kennels: kennels as never,
        breeds: breeds as never,
        breedGroups: breedGroups as never,
        classes,
        grades,
        rings,
      }),
    [entries, results, dogs, kennels, breeds, breedGroups, classes, grades, rings]
  );

  return {
    rows,
    loading: entriesLoading || resultsLoading || dogsLoading,
    isEmpty: !entriesLoading && entries.length === 0,
  };
}
