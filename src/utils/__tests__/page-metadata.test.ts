import { it, expect, describe } from 'vitest';

import { dogMetadata, showMetadata, kennelMetadata } from '../page-metadata';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-24: у всех выставок/собак/питомников был
// один <title> («Выставка - Show Ring») без описания — поисковики и превью
// ссылок в мессенджерах не видели, о чём страница.

describe('page metadata', () => {
  it('describes a show by name, dates and place', () => {
    const meta = showMetadata({
      name: 'CACIB Москва',
      date_start: '2026-11-14',
      date_end: '2026-11-15',
      city: 'Москва',
      venue: 'Крокус Экспо',
    });
    expect(meta.title).toBe('CACIB Москва — выставка собак | Show Ring');
    expect(meta.description).toBe('Выставка собак 2026-11-14 – 2026-11-15, Москва, Крокус Экспо.');
    expect(meta.openGraph?.title).toBe('CACIB Москва');
  });

  it('describes a dog by name', () => {
    expect(dogMetadata({ name: 'Рекс от Сидоровой' }).title).toBe('Рекс от Сидоровой | Show Ring');
  });

  it('describes a kennel by name and city', () => {
    const meta = kennelMetadata({ name: 'Питомник Петрова', city: 'Тверь' });
    expect(meta.title).toBe('Питомник Петрова — питомник | Show Ring');
    expect(meta.description).toBe('Питомник Петрова, Тверь — собаки и помёты на Show Ring.');
  });

  it('falls back to a generic title when the API is unavailable', () => {
    expect(showMetadata(null).title).toBe('Выставка | Show Ring');
    expect(dogMetadata(null).title).toBe('Собака | Show Ring');
    expect(kennelMetadata(null).title).toBe('Питомник | Show Ring');
  });
});
