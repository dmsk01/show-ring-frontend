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

  it('dogs:edit (breeder/admin) даёт доступ независимо от владения', () => {
    expect(canManageDog({ owner_id: 'u2' }, 'u1', canDogsEdit)).toBe(true);
    expect(canManageDog({ owner_id: null }, 'u1', canDogsEdit)).toBe(true);
  });

  it('легаси-собака (owner_id=null) — только по праву', () => {
    expect(canManageDog({ owner_id: null }, 'u1', canNothing)).toBe(false);
  });

  it('без userId (сессия не загружена) — нет доступа', () => {
    expect(canManageDog({ owner_id: 'u1' }, undefined, canNothing)).toBe(false);
    expect(canManageDog({ owner_id: 'u1' }, null, canNothing)).toBe(false);
  });
});
