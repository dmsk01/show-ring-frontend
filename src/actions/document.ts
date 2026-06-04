import type { SWRConfiguration } from 'swr';

import useSWR from 'swr';
import { useMemo } from 'react';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export type TaskStatus = 'pending' | 'processing' | 'done' | 'failed';

// GET /tasks/{id} may return either TaskResponse or TaskStatusResponse.
type RawTask = {
  id?: string;
  task_id?: string;
  status: TaskStatus;
  result?: unknown;
  error?: unknown;
};

function normalizeStatus(data?: RawTask): TaskStatus | undefined {
  return data?.status;
}

// ----------------------------------------------------------------------

export type OfficialKind = 'catalog' | 'diplomas' | 'certificates' | 'ring-sheets';
export type EntryDocKind = 'diploma' | 'certificates';

/** Trigger generation; returns the created task ({ id, status }). */
export async function generateCatalog(showId: string): Promise<{ id: string; status: TaskStatus }> {
  const res = await axios.post(endpoints.show.catalogGenerate(showId));
  return { id: res.data.id ?? res.data.task_id, status: res.data.status };
}

export async function generateDiplomas(
  showId: string
): Promise<{ id: string; status: TaskStatus }> {
  const res = await axios.post(endpoints.show.diplomasGenerate(showId));
  return { id: res.data.id ?? res.data.task_id, status: res.data.status };
}

export async function generateOfficial(
  showId: string,
  kind: OfficialKind,
  ringId?: string
): Promise<{ id: string; status: TaskStatus }> {
  const res = await axios.post(
    endpoints.show.officialDoc(showId, kind),
    null,
    ringId ? { params: { ring_id: ringId } } : undefined
  );
  return { id: res.data.id ?? res.data.task_id, status: res.data.status };
}

export async function generateEntryDocument(
  showId: string,
  entryId: string,
  kind: EntryDocKind
): Promise<{ id: string; status: TaskStatus }> {
  const res = await axios.post(endpoints.show.entryOfficialDoc(showId, entryId, kind));
  return { id: res.data.id ?? res.data.task_id, status: res.data.status };
}

// ----------------------------------------------------------------------

/** Poll a task while it is pending/processing; stop once done/failed. */
export function useGetTask(taskId?: string) {
  const swrOptions: SWRConfiguration = {
    revalidateOnFocus: false,
    refreshInterval: (latest?: RawTask) => {
      const status = normalizeStatus(latest);
      return status === 'pending' || status === 'processing' ? 2000 : 0;
    },
  };

  const { data, isLoading, error } = useSWR<RawTask>(
    taskId ? endpoints.task.details(taskId) : null,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({ status: data?.status, taskLoading: isLoading, taskError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

export function useDocumentsReadiness(showId?: string) {
  const { data, isLoading } = useSWR<Record<string, unknown>>(
    showId ? endpoints.show.documentsReadiness(showId) : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { readiness: data ?? {}, readinessLoading: isLoading };
}

export async function pollTask(
  taskId: string,
  { intervalMs = 1500, timeoutMs = 120000 }: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<TaskStatus> {
  const deadline = Date.now() + timeoutMs;
   
  while (Date.now() < deadline) {
     
    const res = await axios.get<RawTask>(endpoints.task.details(taskId));
    const status = res.data.status;
    if (status === 'done' || status === 'failed') return status;
     
    await new Promise<void>((resolve) => { setTimeout(resolve, intervalMs); });
  }
  return 'processing';
}

// ----------------------------------------------------------------------

function parseFilename(disposition?: string): string | null {
  if (!disposition) return null;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(disposition);
  if (star) return decodeURIComponent(star[1].replace(/["']/g, ''));
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : null;
}

/** Authenticated download of a finished task's file. */
export async function downloadTask(taskId: string, fallbackName: string): Promise<void> {
  const res = await axios.get(endpoints.task.download(taskId), { responseType: 'blob' });
  const name = parseFilename(res.headers['content-disposition'] as string | undefined) ?? fallbackName;
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
