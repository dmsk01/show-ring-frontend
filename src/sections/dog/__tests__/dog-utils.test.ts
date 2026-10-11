import { it, expect, describe } from 'vitest';

import { canManageDog, dogPlaceholderImage } from '../dog-utils';

describe('dogPlaceholderImage', () => {
  it('returns the female cover for female', () => {
    expect(dogPlaceholderImage('female')).toContain('cover-7');
  });
  it('returns the male cover for male', () => {
    expect(dogPlaceholderImage('male')).toContain('cover-12');
  });
  it('falls back to male cover for null/undefined', () => {
    expect(dogPlaceholderImage(null)).toContain('cover-12');
    expect(dogPlaceholderImage(undefined)).toContain('cover-12');
  });
});

describe('canManageDog', () => {
  const canNothing = () => false;
  const canDogsEdit = (p: string) => p === 'dogs:edit';

  it('владелец по owner_id управляет без пермиссий', () => {
    expect(canManageDog({ owner_id: 'u1' }, 'u1', canNothing)).toBe(true);
  });

  it('чужая собака без dogs:edit — нет доступа', () => {
    expect(canManageDog({ owner_id: 'u2' }, 'u1', canNothing)).toBe(false);
  });

  // Ревью фронтенда 2026-10-09, FE-33: право dogs:edit есть у любого
  // заводчика, а бэкенд пускает только владельца собаки, владельца её
  // питомника и admin — кнопка «Изменить» у чужих собак давала 403.
  it('dogs:edit (роль заводчика) НЕ даёт доступа к чужой собаке', () => {
    expect(canManageDog({ owner_id: 'u2', kennel_id: null }, 'u1', canDogsEdit)).toBe(false);
  });

  it('admin управляет любой собакой', () => {
    const canAll = (p: string) => p === '*';
    expect(canManageDog({ owner_id: 'u2', kennel_id: null }, 'u1', canAll)).toBe(true);
    expect(canManageDog({ owner_id: null, kennel_id: null }, 'u1', canAll)).toBe(true);
  });

  it('владелец питомника собаки управляет ею', () => {
    const mine = new Set(['k1']);
    expect(canManageDog({ owner_id: 'u2', kennel_id: 'k1' }, 'u1', canNothing, mine)).toBe(true);
    expect(canManageDog({ owner_id: null, kennel_id: 'k1' }, 'u1', canNothing, mine)).toBe(true);
    expect(canManageDog({ owner_id: 'u2', kennel_id: 'k2' }, 'u1', canNothing, mine)).toBe(false);
  });

  it('легаси-собака (owner_id=null) без питомника — только admin', () => {
    expect(canManageDog({ owner_id: null }, 'u1', canNothing)).toBe(false);
  });

  it('без userId (сессия не загружена) — нет доступа', () => {
    expect(canManageDog({ owner_id: 'u1' }, undefined, canNothing)).toBe(false);
    expect(canManageDog({ owner_id: 'u1' }, null, canNothing)).toBe(false);
  });
});
