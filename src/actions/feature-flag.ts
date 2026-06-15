import type { SWRConfiguration } from 'swr';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

// Flags change rarely and the endpoint is public — fetch once, don't revalidate
// on focus/reconnect. A full reload refetches the snapshot.
const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useFeatureFlagsQuery() {
  const { data, isLoading, error } = useSWR<Record<string, boolean>>(
    endpoints.featureFlags,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      flags: data ?? {},
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );
}
