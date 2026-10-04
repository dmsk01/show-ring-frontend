import type { SWRConfiguration } from 'swr';
import type { IShowItem } from 'src/types/show';
import type {
  ITicket,
  IEntryCard,
  IShowStaff,
  IEntryCheck,
  IDogDocument,
  DogDocumentKind,
  ICheckinSummary,
  IParticipantCard,
  IEntryCheckCreate,
} from 'src/types/checkin';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { CONFIG } from 'src/global-config';
import axios, { fetcher, endpoints } from 'src/lib/axios';

import { UploadError, parseUploadError } from './file-errors';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------
// Документы собаки

export function useDogDocuments(dogId?: string) {
  const key = dogId ? endpoints.dog.documents(dogId) : null;
  const { data, isLoading, error } = useSWR<IDogDocument[]>(key, fetcher, swrOptions);
  return useMemo(
    () => ({ documents: data ?? [], documentsLoading: isLoading, documentsError: error }),
    [data, error, isLoading]
  );
}

const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_503_RETRIES = 2;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Загрузить скан документа. В отличие от uploadFile, изображение НЕ
 * пережимается: скан ветпаспорта должен остаться читаемым.
 */
export async function uploadDogDocument(
  dogId: string,
  file: File,
  kind: DogDocumentKind,
  validUntil?: string | null
): Promise<IDogDocument> {
  if (!DOCUMENT_TYPES.includes(file.type)) throw new UploadError('unsupported_type');
  if (file.size > DOCUMENT_MAX_BYTES) throw new UploadError('file_too_large');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('kind', kind);
  if (validUntil) formData.append('valid_until', validUntil);

  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await axios.post<IDogDocument>(endpoints.dog.documents(dogId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await mutate(endpoints.dog.documents(dogId));
      return res.data;
    } catch (error) {
      const uploadError = parseUploadError(error);
      if (uploadError.code === 'storage_busy' && attempt < MAX_503_RETRIES) {
        await sleep((uploadError.retryAfterSeconds ?? 5) * 1000);
        continue;
      }
      throw uploadError;
    }
  }
}

export async function deleteDogDocument(dogId: string, docId: string): Promise<void> {
  await axios.delete(endpoints.dog.document(dogId, docId));
  await mutate(endpoints.dog.documents(dogId));
}

/** URL скачивания (за ACL: авторизационная кука уходит с запросом сама). */
export function dogDocumentUrl(dogId: string, docId: string): string {
  return `${CONFIG.serverUrl}${endpoints.dog.documentDownload(dogId, docId)}`;
}

// ----------------------------------------------------------------------
// Организатор: флаг и персонал

export async function setCheckinEnabled(showId: string, enabled: boolean): Promise<IShowItem> {
  const res = await axios.put<IShowItem>(endpoints.checkin.settings(showId), { enabled });
  await mutate(endpoints.show.details(showId));
  return res.data;
}

export function useShowStaff(showId?: string) {
  const key = showId ? endpoints.checkin.staff(showId) : null;
  const { data, isLoading, error } = useSWR<IShowStaff[]>(key, fetcher, swrOptions);
  return useMemo(
    () => ({ staff: data ?? [], staffLoading: isLoading, staffError: error }),
    [data, error, isLoading]
  );
}

/** Контакт с «+» — телефон в E.164, иначе email. */
export async function addShowStaff(showId: string, contact: string): Promise<IShowStaff> {
  const value = contact.trim();
  const body = value.startsWith('+') ? { phone: value.replace(/[\s()-]/g, '') } : { email: value };
  const res = await axios.post<IShowStaff>(endpoints.checkin.staff(showId), body);
  await mutate(endpoints.checkin.staff(showId));
  return res.data;
}

export async function removeShowStaff(showId: string, userId: string): Promise<void> {
  await axios.delete(endpoints.checkin.staffMember(showId, userId));
  await mutate(endpoints.checkin.staff(showId));
}

export function useStaffShows() {
  const { data, isLoading, error } = useSWR<IShowItem[]>(
    endpoints.checkin.staffMy,
    fetcher,
    swrOptions
  );
  return useMemo(
    () => ({ shows: data ?? [], showsLoading: isLoading, showsError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------
// Участник

export function useMyTicket(showId?: string) {
  const key = showId ? endpoints.checkin.ticket(showId) : null;
  const { data, isLoading, error } = useSWR<ITicket>(key, fetcher, swrOptions);
  return useMemo(
    () => ({ ticket: data, ticketLoading: isLoading, ticketError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------
// Стойка

export function useCheckinSummary(showId?: string) {
  const key = showId ? endpoints.checkin.summary(showId) : null;
  // Несколько стоек работают параллельно — общая картина раз в 15 секунд.
  const { data, isLoading, error } = useSWR<ICheckinSummary>(key, fetcher, {
    ...swrOptions,
    refreshInterval: 15000,
  });
  return useMemo(
    () => ({ summary: data, summaryLoading: isLoading, summaryError: error }),
    [data, error, isLoading]
  );
}

export function usePrecheckQueue(showId?: string) {
  const key = showId ? endpoints.checkin.precheckQueue(showId) : null;
  const { data, isLoading, error } = useSWR<IEntryCard[]>(key, fetcher, swrOptions);
  return useMemo(
    () => ({ queue: data ?? [], queueLoading: isLoading, queueError: error }),
    [data, error, isLoading]
  );
}

export function useEntryChecks(showId?: string, entryId?: string | null) {
  const key = showId && entryId ? endpoints.checkin.checks(showId, entryId) : null;
  const { data, isLoading, error } = useSWR<IEntryCheck[]>(key, fetcher, swrOptions);
  return useMemo(
    () => ({ checks: data ?? [], checksLoading: isLoading, checksError: error }),
    [data, error, isLoading]
  );
}

export async function scanTicket(showId: string, token: string): Promise<IParticipantCard> {
  const res = await axios.post<IParticipantCard>(endpoints.checkin.scan(showId), { token });
  return res.data;
}

export async function searchCheckin(showId: string, q: string): Promise<IEntryCard[]> {
  const res = await axios.get<IEntryCard[]>(endpoints.checkin.search(showId), { params: { q } });
  return res.data;
}

export async function addEntryChecks(
  showId: string,
  entryId: string,
  checks: IEntryCheckCreate[]
): Promise<IEntryCard> {
  const res = await axios.post<IEntryCard>(endpoints.checkin.checks(showId, entryId), { checks });
  await Promise.all([
    mutate(endpoints.checkin.summary(showId)),
    mutate(endpoints.checkin.checks(showId, entryId)),
    mutate(endpoints.checkin.precheckQueue(showId)),
  ]);
  return res.data;
}

/** detail-код из ответа бэкенда (axios-интерсептор кладёт response в ошибку). */
export function errorDetail(error: unknown): unknown {
  return (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
}
