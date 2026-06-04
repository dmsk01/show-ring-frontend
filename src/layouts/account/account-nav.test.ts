import { it, expect, describe } from 'vitest';

import { paths } from 'src/routes/paths';

import { getUserDisplay, getMyObjectLinks } from './account-nav';

describe('getUserDisplay', () => {
  it('строит имя из first_name + last_name', () => {
    const r = getUserDisplay({ email: 'a@b.c' }, { first_name: 'Иван', last_name: 'Петров', patronymic: null, country: null });
    expect(r.displayName).toBe('Иван Петров');
    expect(r.initial).toBe('И');
    expect(r.email).toBe('a@b.c');
  });

  it('падает на email, когда профиль пуст', () => {
    const r = getUserDisplay({ email: 'demo@x.io' }, undefined);
    expect(r.displayName).toBe('demo@x.io');
    expect(r.initial).toBe('D');
  });

  it('не падает на полностью пустых данных', () => {
    const r = getUserDisplay(null, null);
    expect(r.displayName).toBe('');
    expect(r.initial).toBe('?');
    expect(r.email).toBe('');
  });
});

describe('getMyObjectLinks', () => {
  it('breeder (полные права) видит все три ссылки', () => {
    const can = (p: string) => ['kennels', 'dogs', 'litters'].includes(p);
    const links = getMyObjectLinks(can);
    expect(links.map((l) => l.key)).toEqual(['kennels', 'dogs', 'litters']);
    expect(links[0].href).toBe(paths.dashboard.kennels.root);
  });

  it('view-only права не дают ссылок', () => {
    const can = (p: string) => p === 'kennels:view' || p === 'dogs:view';
    expect(getMyObjectLinks(can)).toEqual([]);
  });

  it('частичные права фильтруются', () => {
    const can = (p: string) => p === 'dogs';
    const links = getMyObjectLinks(can);
    expect(links.map((l) => l.key)).toEqual(['dogs']);
  });
});
