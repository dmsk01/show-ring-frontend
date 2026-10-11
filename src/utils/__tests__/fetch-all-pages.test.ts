import { it, expect, describe } from 'vitest';

import { fetchAllPages } from '../fetch-all-pages';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-07: справочники брались одной страницей
// per_page=200, а пород FCI 362 — 162 породы нельзя было выбрать.

type Item = { id: number };

/** Сервер-заглушка: `total` записей, страница не больше `cap` (как cap_per_page). */
function server(total: number, cap: number) {
  const pages: number[] = [];
  const fetchPage = async (page: number, perPage: number) => {
    pages.push(page);
    const size = Math.min(perPage, cap);
    const start = (page - 1) * size;
    const items: Item[] = [];
    for (let i = start; i < Math.min(start + size, total); i += 1) items.push({ id: i });
    return { items, total, page, per_page: size };
  };
  return { fetchPage, pages };
}

describe('fetchAllPages', () => {
  it('collects all 362 breeds over two pages of 200', async () => {
    const { fetchPage, pages } = server(362, 200);
    const items = await fetchAllPages<Item>(fetchPage);
    expect(items).toHaveLength(362);
    expect(items[361]).toEqual({ id: 361 });
    expect(pages).toEqual([1, 2]);
  });

  it('follows the page size the server actually returned (anonymous cap 50)', async () => {
    const { fetchPage, pages } = server(120, 50);
    const items = await fetchAllPages<Item>(fetchPage);
    expect(items).toHaveLength(120);
    expect(pages).toEqual([1, 2, 3]);
  });

  it('returns a bare array response as is with a single request', async () => {
    let calls = 0;
    const items = await fetchAllPages<Item>(async () => {
      calls += 1;
      return [{ id: 1 }, { id: 2 }];
    });
    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(calls).toBe(1);
  });

  it('stops on an empty page even if total claims more', async () => {
    let calls = 0;
    const items = await fetchAllPages<Item>(async (page) => {
      calls += 1;
      return { items: page === 1 ? [{ id: 1 }] : [], total: 1000, page, per_page: 200 };
    });
    expect(items).toEqual([{ id: 1 }]);
    expect(calls).toBe(2);
  });
});
