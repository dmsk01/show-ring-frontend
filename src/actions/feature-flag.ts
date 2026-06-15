import type { SWRConfiguration } from 'swr';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

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

/** PUT /feature-flags/{name} (admin). Revalidates the public snapshot so the
 *  gating layer (nav/routes/inline) reflects the change app-wide. */
export async function setFeatureFlag(name: string, enabled: boolean): Promise<void> {
  await axios.put(endpoints.featureFlag(name), { enabled });
  await mutate(endpoints.featureFlags);
}
