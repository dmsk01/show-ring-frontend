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

const isNotificationsKey = (key: unknown) =>
  Array.isArray(key) && key[0] === endpoints.notification.list;

// Mark a single notification read. Optimistic: flip is_read/read_at in cache
// immediately, then PATCH; on failure revalidate from the server to roll back.
// The backend PATCH is idempotent, so a redundant call is harmless.
export async function markNotificationRead(id: string): Promise<void> {
  await mutate(
    isNotificationsKey,
    (current?: INotification[]) =>
      current?.map((n) =>
        n.id === id ? { ...n, is_read: true, read_at: n.read_at ?? new Date().toISOString() } : n
      ),
    { revalidate: false }
  );

  try {
    await axios.patch(endpoints.notification.markRead(id));
  } catch (error) {
    await mutate(isNotificationsKey);
    throw error;
  }
}

export async function createSubscription(payload: ISubscriptionCreate): Promise<ISubscription> {
  const res = await axios.post<ISubscription>(endpoints.notification.subscriptions, payload);
  await mutate(endpoints.notification.subscriptions);
  return res.data;
}

export async function deleteSubscription(id: string): Promise<void> {
  await axios.delete(endpoints.notification.subscription(id));
  await mutate(endpoints.notification.subscriptions);
}
