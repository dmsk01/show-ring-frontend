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

const unreadCountKey = endpoints.notification.unreadCount;

export function useGetUnreadCount() {
  const { data } = useSWR<{ unread: number }>(unreadCountKey, fetcher, {
    ...swrOptions,
    revalidateOnFocus: true, // keep the bell badge fresh when returning to the tab
    refreshInterval: 60_000,
  });

  return useMemo(() => ({ unreadCount: data?.unread ?? 0 }), [data]);
}

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
    await mutate(unreadCountKey); // reconcile the badge from the server
  } catch (error) {
    await mutate(isNotificationsKey);
    await mutate(unreadCountKey);
    throw error;
  }
}

// Mark every notification read in one atomic call. Returns the number actually
// flipped (idempotent: a repeat call returns 0). Optimistic on both caches.
export async function markAllNotificationsRead(): Promise<number> {
  const now = new Date().toISOString();

  await mutate(
    isNotificationsKey,
    (current?: INotification[]) =>
      current?.map((n) => (n.is_read ? n : { ...n, is_read: true, read_at: now })),
    { revalidate: false }
  );
  await mutate(unreadCountKey, { unread: 0 }, { revalidate: false });

  try {
    const res = await axios.patch<{ marked: number }>(endpoints.notification.readAll);
    return res.data.marked;
  } catch (error) {
    await mutate(isNotificationsKey);
    await mutate(unreadCountKey);
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
