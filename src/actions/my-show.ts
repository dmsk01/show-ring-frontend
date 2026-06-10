import type { SWRConfiguration } from 'swr';
import type { IMyShowPage, MyShowStatusGroup } from 'src/types/show';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

type MyShowsQuery = {
  statusGroup: MyShowStatusGroup;
  page: number; // 1-based
  perPage?: number;
};

/** Выставки, где у текущего пользователя есть записи (агрегат). */
export function useMyShows({ statusGroup, page, perPage = 12 }: MyShowsQuery) {
  const params = { status_group: statusGroup, page, per_page: perPage };
  const key: [string, { params: typeof params }] = [endpoints.show.myShowsList, { params }];

  const { data, isLoading, error, isValidating } = useSWR<IMyShowPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      items: data?.items ?? [],
      total: data?.total ?? 0,
      isLoading,
      error,
      isEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
    }),
    [data, error, isLoading, isValidating]
  );
}
