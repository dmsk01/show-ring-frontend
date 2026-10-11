import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------
// Метаданные публичных страниц из данных API (ревью 2026-10-09, FE-24).
// null — API недоступен при рендере: общий заголовок, страница всё равно
// отрисуется на клиенте.

const suffix = ` | ${CONFIG.appName}`;

type ShowMeta = {
  name: string;
  date_start: string;
  date_end: string | null;
  city: string | null;
  venue: string | null;
};

export function showMetadata(show: ShowMeta | null): Metadata {
  if (!show) return { title: `Выставка${suffix}` };
  const dates = show.date_end ? `${show.date_start} – ${show.date_end}` : show.date_start;
  const place = [show.city, show.venue].filter(Boolean).join(', ');
  const description = `Выставка собак ${dates}${place ? `, ${place}` : ''}.`;
  return {
    title: `${show.name} — выставка собак${suffix}`,
    description,
    openGraph: { title: show.name, description },
  };
}

export function dogMetadata(dog: { name: string } | null): Metadata {
  if (!dog) return { title: `Собака${suffix}` };
  return { title: `${dog.name}${suffix}`, openGraph: { title: dog.name } };
}

export function kennelMetadata(kennel: { name: string; city: string | null } | null): Metadata {
  if (!kennel) return { title: `Питомник${suffix}` };
  const description = `${kennel.name}${kennel.city ? `, ${kennel.city}` : ''} — собаки и помёты на ${CONFIG.appName}.`;
  return {
    title: `${kennel.name} — питомник${suffix}`,
    description,
    openGraph: { title: kennel.name, description },
  };
}

/** GET публичного ресурса с сервера Next (мимо nginx); любая ошибка → null. */
export async function fetchPublic<T>(path: string): Promise<T | null> {
  const base = process.env.BACKEND_URL ?? 'http://localhost:8000';
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { 'Accept-Language': 'ru' },
      next: { revalidate: 300 },
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}
