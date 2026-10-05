import type { MetadataRoute } from 'next';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------
// sitemap.xml — публичные страницы для Яндекса и Google. Динамические
// разделы (выставки, питомники) берутся из API прямо с сервера Next.js
// (BACKEND_URL, мимо nginx). Пересобирается раз в сутки.

export const revalidate = 86400;

// Анонимный список API отдаёт не больше 50 записей за запрос
// (app/utils/pagination.py) — листаем страницами, но не бесконечно.
const PAGE_SIZE = 50;
const MAX_PAGES = 20;

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

type ListPage = { items: { id: string; updated_at?: string }[]; total: number };

async function listIds(path: string): Promise<{ id: string; updated_at?: string }[]> {
  const out: { id: string; updated_at?: string }[] = [];
  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const res = await fetch(`${BACKEND_URL}${path}?page=${page}&per_page=${PAGE_SIZE}`, {
        next: { revalidate },
      });
      if (!res.ok) break;
      const data = (await res.json()) as ListPage;
      out.push(...data.items);
      if (out.length >= data.total || data.items.length < PAGE_SIZE) break;
    }
  } catch {
    // API недоступен при сборке/рендере — отдаём хотя бы статические страницы.
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${CONFIG.siteUrl}${path}`;

  const staticPages: MetadataRoute.Sitemap = [
    { url: url('/'), changeFrequency: 'daily', priority: 1 },
    { url: url(paths.showcase.shows), changeFrequency: 'daily', priority: 0.9 },
    { url: url(paths.showcase.kennels), changeFrequency: 'daily', priority: 0.8 },
    { url: url(paths.showcase.animals), changeFrequency: 'daily', priority: 0.8 },
    { url: url(paths.about), changeFrequency: 'monthly', priority: 0.4 },
    { url: url(paths.faqs), changeFrequency: 'monthly', priority: 0.4 },
    { url: url(paths.contact), changeFrequency: 'monthly', priority: 0.3 },
    ...Object.values(paths.legal).map((path) => ({
      url: url(path),
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    })),
  ];

  const [shows, kennels] = await Promise.all([listIds('/shows'), listIds('/kennels')]);

  return [
    ...staticPages,
    ...shows.map((s) => ({
      url: url(paths.showcase.show(s.id)),
      lastModified: s.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...kennels.map((k) => ({
      url: url(paths.showcase.kennel(k.id)),
      lastModified: k.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
