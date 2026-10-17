import { it, vi, expect, describe, afterEach } from 'vitest';

import sitemap from '../sitemap';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-24: в sitemap не было постов блога.

function page(items: Record<string, unknown>[]) {
  return { ok: true, json: async () => ({ items, total: items.length }) };
}

afterEach(() => vi.unstubAllGlobals());

describe('sitemap', () => {
  it('lists published blog posts by slug', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/posts'))
          return page([{ id: 'p1', slug: 'itogi-cacib', created_at: '2026-10-01T00:00:00Z' }]);
        return page([]);
      })
    );

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.some((u) => u.endsWith('/post/itogi-cacib'))).toBe(true);
  });

  it('lists dogs and classifieds by their public pages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/dogs?')) return page([{ id: 'd1', updated_at: '2026-10-01T00:00:00Z' }]);
        if (url.includes('/classifieds?')) return page([{ id: 'c1' }]);
        return page([]);
      })
    );

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.some((u) => u.endsWith('/dogs/d1'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/animals/c1'))).toBe(true);
  });
});
