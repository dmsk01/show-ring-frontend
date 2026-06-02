import type { SWRConfiguration } from 'swr';
import type { IAdsDaily, ITopBreed, ITopCampaign, IDashboardStats } from 'src/types/analytics';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function useDashboardStats() {
  const { data, isLoading, error } = useSWR<IDashboardStats>(
    endpoints.admin.analyticsDashboard,
    fetcher,
    swrOptions
  );
  return useMemo(
    () => ({ stats: data, statsLoading: isLoading, statsError: error }),
    [data, error, isLoading]
  );
}

export function useTopBreeds() {
  const { data, isLoading } = useSWR<ITopBreed[]>(
    endpoints.admin.analyticsTopBreeds,
    fetcher,
    swrOptions
  );
  return useMemo(() => ({ topBreeds: data ?? [], topBreedsLoading: isLoading }), [data, isLoading]);
}

export function useTopCampaigns() {
  const { data, isLoading } = useSWR<ITopCampaign[]>(
    endpoints.admin.analyticsTopCampaigns,
    fetcher,
    swrOptions
  );
  return useMemo(
    () => ({ topCampaigns: data ?? [], topCampaignsLoading: isLoading }),
    [data, isLoading]
  );
}

export function useAdsDaily() {
  const { data, isLoading } = useSWR<IAdsDaily[]>(
    endpoints.admin.analyticsAds,
    fetcher,
    swrOptions
  );
  return useMemo(() => ({ adsDaily: data ?? [], adsDailyLoading: isLoading }), [data, isLoading]);
}
