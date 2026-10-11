import { it, expect, describe } from 'vitest';

import { onAuthChanged, notifyAuthChanged } from '../context/jwt/auth-channel';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-05: выход в одной вкладке не доходил до
// других — там оставались данные пользователя из SWR-кэша.

const nextTick = () => new Promise((r) => setTimeout(r, 20));

describe('auth channel', () => {
  it('delivers logout to other listeners (other tabs)', async () => {
    const received: string[] = [];
    const unsubscribe = onAuthChanged((event) => received.push(event));

    notifyAuthChanged('logout');
    await nextTick();

    expect(received).toEqual(['logout']);
    unsubscribe();
  });

  it('stops delivering after unsubscribe', async () => {
    const received: string[] = [];
    const unsubscribe = onAuthChanged((event) => received.push(event));
    unsubscribe();

    notifyAuthChanged('login');
    await nextTick();

    expect(received).toEqual([]);
  });
});
