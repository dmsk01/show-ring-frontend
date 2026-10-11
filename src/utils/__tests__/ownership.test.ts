import { it, expect, describe } from 'vitest';

import { myKennelIds, canManageKennel, canManageLitter } from '../ownership';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-33: «Изменить»/«Удалить» показывались у
// чужих питомников и помётов, бэкенд отвечал 403 (владелец питомника или admin).

const canNothing = () => false;
const canAll = (p: string) => p === '*';
const canKennels = (p: string) => p.startsWith('kennels') || p.startsWith('litters');

describe('canManageKennel', () => {
  it('allows the owner and admin only', () => {
    expect(canManageKennel({ owner_id: 'u1' }, 'u1', canNothing)).toBe(true);
    expect(canManageKennel({ owner_id: 'u2' }, 'u1', canAll)).toBe(true);
    expect(canManageKennel({ owner_id: 'u2' }, 'u1', canKennels)).toBe(false);
    expect(canManageKennel({ owner_id: 'u1' }, undefined, canNothing)).toBe(false);
  });
});

describe('canManageLitter', () => {
  const mine = new Set(['k1']);

  it('allows the owner of the litter kennel and admin only', () => {
    expect(canManageLitter({ kennel_id: 'k1' }, 'u1', canNothing, mine)).toBe(true);
    expect(canManageLitter({ kennel_id: 'k2' }, 'u1', canAll, mine)).toBe(true);
    expect(canManageLitter({ kennel_id: 'k2' }, 'u1', canKennels, mine)).toBe(false);
    expect(canManageLitter({ kennel_id: 'k1' }, undefined, canNothing, mine)).toBe(false);
  });
});

describe('myKennelIds', () => {
  it('collects ids of kennels owned by the user', () => {
    const kennels = [
      { id: 'k1', owner_id: 'u1' },
      { id: 'k2', owner_id: 'u2' },
      { id: 'k3', owner_id: 'u1' },
    ];
    expect([...myKennelIds(kennels, 'u1')]).toEqual(['k1', 'k3']);
    expect(myKennelIds(kennels, undefined).size).toBe(0);
  });
});
