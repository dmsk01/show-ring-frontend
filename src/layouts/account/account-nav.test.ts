import { it, expect, describe } from 'vitest';

import { paths } from 'src/routes/paths';

import { can as canPerm } from 'src/utils/permissions';

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

const canFor = (granted: string[]) => (p: string) => canPerm(p, granted);

describe('getMyObjectLinks', () => {
  it('breeder (полные права) видит все три ссылки; dogs ведёт в личный раздел', () => {
    const links = getMyObjectLinks(canFor(['kennels', 'dogs', 'litters']));
    expect(links.map((l) => l.key)).toEqual(['kennels', 'dogs', 'litters']);
    expect(links[0].href).toBe(paths.dashboard.kennels.root);
    expect(links[1].href).toBe(paths.dashboard.myDogs.root);
  });

  it('buyer (dogs:create без полного dogs) видит только «Мои собаки»', () => {
    const links = getMyObjectLinks(canFor(['dogs:view', 'dogs:create', 'kennels:view']));
    expect(links.map((l) => l.key)).toEqual(['dogs']);
    expect(links[0].href).toBe(paths.dashboard.myDogs.root);
  });

  it('view-only права не дают ссылок', () => {
    expect(getMyObjectLinks(canFor(['kennels:view', 'dogs:view']))).toEqual([]);
  });
});
