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

/** Authenticated download of a finished task's file. */
export async function downloadTask(taskId: string, filename: string): Promise<void> {
  const res = await axios.get(endpoints.task.download(taskId), { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
