import type { SWRConfiguration } from 'swr';
import type { INotification, ISubscription, ISubscriptionCreate } from 'src/types/notification';

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

export function useGetNotifications() {
  const key: [string, { params: { per_page: number } }] = [
    endpoints.notification.list,
    { params: { per_page: 50 } },
  ];
  const { data, isLoading, error } = useSWR<INotification[]>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      notifications: data ?? [],
      notificationsLoading: isLoading,
      notificationsError: error,
    }),
    [data, error, isLoading]
  );
}

export function useGetSubscriptions() {
  const { data, isLoading, error } = useSWR<ISubscription[]>(
    endpoints.notification.subscriptions,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      subscriptions: data ?? [],
      subscriptionsLoading: isLoading,
      subscriptionsError: error,
    }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

export async function createSubscription(payload: ISubscriptionCreate): Promise<ISubscription> {
  const res = await axios.post<ISubscription>(endpoints.notification.subscriptions, payload);
  await mutate(endpoints.notification.subscriptions);
  return res.data;
}

export async function deleteSubscription(id: string): Promise<void> {
  await axios.delete(endpoints.notification.subscription(id));
  await mutate(endpoints.notification.subscriptions);
}
