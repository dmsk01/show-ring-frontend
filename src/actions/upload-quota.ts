import type { SWRConfiguration } from 'swr';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export type UploadTier = 'untrusted' | 'standard' | 'breeder';

export type IUploadQuota = {
  tier: UploadTier;
  daily_limit: number;
  max_storage_bytes: number;
};

export type IUploadQuotaUpdate = {
  daily_limit: number;
  max_storage_bytes: number;
};

// ----------------------------------------------------------------------

export function useUploadQuotas() {
  const { data, isLoading, error } = useSWR<IUploadQuota[]>(
    endpoints.admin.uploadQuotas,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      quotas: data ?? [],
      quotasLoading: isLoading,
      quotasError: error,
    }),
    [data, isLoading, error]
  );
}

/** PUT /admin/upload-quotas/{tier}. Неизвестный тир → 404. */
export async function updateUploadQuota(
  tier: UploadTier,
  payload: IUploadQuotaUpdate
): Promise<void> {
  await axios.put(endpoints.admin.uploadQuota(tier), payload);
  await mutate(endpoints.admin.uploadQuotas);
}
