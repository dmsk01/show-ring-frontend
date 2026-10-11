import type * as SwrModule from 'swr';
import type * as AxiosModule from 'src/lib/axios';

import { it, vi, expect, describe, beforeEach } from 'vitest';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-21: create/update/delete записи не
// сбрасывали кэш списка записей выставки ([entries(showId), {params}]) —
// организатор видел старый класс до перезагрузки.

const mutate = vi.fn(async () => undefined);
vi.mock('swr', async (importOriginal) => ({
  ...(await importOriginal<typeof SwrModule>()),
  mutate: (...args: unknown[]) => mutate(...(args as [])),
}));
vi.mock('src/lib/axios', async (importOriginal) => {
  const actual = await importOriginal<typeof AxiosModule>();
  return {
    ...actual,
    default: {
      delete: vi.fn(async () => ({})),
      patch: vi.fn(async () => ({ data: {} })),
      post: vi.fn(async () => ({ data: {} })),
    },
  };
});

const { endpoints } = await import('src/lib/axios');
const { deleteShowEntry, updateShowEntry, createShowEntry } = await import('../show-entry');

function matchers(): ((key: unknown) => boolean)[] {
  return mutate.mock.calls
    .map((call) => (call as unknown[])[0])
    .filter((arg): arg is (key: unknown) => boolean => typeof arg === 'function');
}

const entriesKey = [endpoints.show.entries('s1'), { params: { per_page: 200 } }];
const entryRowsKey = [endpoints.show.entriesTable('s1'), 'all-pages'];

describe('show entry mutations invalidate the show entries list', () => {
  beforeEach(() => mutate.mockClear());

  it.each([
    ['delete', () => deleteShowEntry('s1', 'e1')],
    ['update', () => updateShowEntry('s1', 'e1', { notes: 'x' })],
    ['create', () => createShowEntry('s1', { dog_id: 'd1', show_class_id: 'c1' })],
  ])('%s', async (_name, action) => {
    await action();
    expect(matchers().some((match) => match(entriesKey))).toBe(true);
    // Таблица результатов (FE-08) читает /entries/table — её тоже сбрасываем.
    expect(matchers().some((match) => match(entryRowsKey))).toBe(true);
  });
});
