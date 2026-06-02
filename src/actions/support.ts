import type { SWRConfiguration } from 'swr';
import type { ITicket, IMessage, TicketStatus, ITicketCreate } from 'src/types/support';

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

export function useGetTickets() {
  const { data, isLoading, error } = useSWR<ITicket[]>(endpoints.support.tickets, fetcher, swrOptions);

  return useMemo(
    () => ({
      tickets: data ?? [],
      ticketsLoading: isLoading,
      ticketsError: error,
      ticketsEmpty: !isLoading && !(data?.length ?? 0),
    }),
    [data, error, isLoading]
  );
}

export function useGetTicket(ticketId?: string) {
  const key = ticketId ? endpoints.support.ticket(ticketId) : null;
  const { data, isLoading, error } = useSWR<ITicket>(key, fetcher, swrOptions);
  return useMemo(
    () => ({ ticket: data, ticketLoading: isLoading, ticketError: error }),
    [data, error, isLoading]
  );
}

export function useGetTicketMessages(ticketId?: string) {
  const key = ticketId ? endpoints.support.messages(ticketId) : null;
  const { data, isLoading, error } = useSWR<IMessage[]>(key, fetcher, swrOptions);
  return useMemo(
    () => ({ messages: data ?? [], messagesLoading: isLoading, messagesError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

export async function createTicket(payload: ITicketCreate): Promise<ITicket> {
  const res = await axios.post<ITicket>(endpoints.support.tickets, payload);
  await mutate(endpoints.support.tickets);
  return res.data;
}

export async function postMessage(ticketId: string, body: string): Promise<void> {
  await axios.post(endpoints.support.messages(ticketId), { body });
  await mutate(endpoints.support.messages(ticketId));
}

export async function setTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  await axios.put(endpoints.support.ticketStatus(ticketId), { status });
  await mutate(endpoints.support.ticket(ticketId));
  await mutate(endpoints.support.tickets);
}
