import type { SWRConfiguration } from 'swr';
import type {
  ICampaign,
  IBannerCreate,
  ICampaignStats,
  ICampaignCreate,
  ICampaignUpdate,
} from 'src/types/ad';

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

export function useGetCampaigns() {
  const { data, isLoading, error } = useSWR<ICampaign[]>(endpoints.ad.campaigns, fetcher, swrOptions);

  return useMemo(
    () => ({
      campaigns: data ?? [],
      campaignsLoading: isLoading,
      campaignsError: error,
      campaignsEmpty: !isLoading && !(data?.length ?? 0),
    }),
    [data, error, isLoading]
  );
}

export function useGetCampaignStats(campaignId?: string) {
  const key = campaignId ? endpoints.ad.campaignStats(campaignId) : null;

  const { data, isLoading, error } = useSWR<ICampaignStats>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ stats: data, statsLoading: isLoading, statsError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

const revalidateList = () => mutate(endpoints.ad.campaigns);

export async function createCampaign(payload: ICampaignCreate): Promise<ICampaign> {
  const res = await axios.post<ICampaign>(endpoints.ad.campaigns, payload);
  await revalidateList();
  return res.data;
}

export async function updateCampaign(id: string, payload: ICampaignUpdate): Promise<ICampaign> {
  const res = await axios.put<ICampaign>(endpoints.ad.campaign(id), payload);
  await revalidateList();
  return res.data;
}

export async function createBanner(campaignId: string, payload: IBannerCreate): Promise<void> {
  await axios.post(endpoints.ad.campaignBanners(campaignId), payload);
}
