import { it, expect, describe } from 'vitest';

import { authGuardDecision, userAfterProbeError } from '../context/jwt/session-probe';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-03: сбой /users/me (5xx, сеть, 429 refresh)
// обнулял пользователя → полный reload или редирект на вход.

const user = { id: 'u1', email: 'a@b.c' };

const apiError = (status?: number) => Object.assign(new Error('x'), { status });

describe('userAfterProbeError', () => {
  it('treats 401 as anonymous', () => {
    expect(userAfterProbeError(apiError(401), user)).toBeNull();
  });

  it.each([
    ['server error', apiError(500)],
    ['rate-limited refresh', apiError(429)],
    ['network error', apiError(undefined)],
  ])('keeps the current user on %s', (_name, error) => {
    expect(userAfterProbeError(error, user)).toBe(user);
  });

  it('stays anonymous when there was no user before', () => {
    expect(userAfterProbeError(apiError(500), null)).toBeNull();
  });

  // Регрессия FE-03 (живой прогон e2e): после «Выйти» refresh без куки под
  // нагрузкой отвечал 429, и пользователь оставался «вошедшим» в интерфейсе.
  it('treats any error after an explicit logout as anonymous', () => {
    expect(userAfterProbeError(apiError(429), user, { afterLogout: true })).toBeNull();
    expect(userAfterProbeError(apiError(undefined), user, { afterLogout: true })).toBeNull();
  });
});

// FE-03, первая загрузка: при временном сбое проверки сессии пользователь
// неизвестен — не уводим на вход, а предлагаем повторить.
describe('authGuardDecision', () => {
  it.each([
    [{ loading: true, authenticated: false, sessionUnknown: false }, 'wait'],
    [{ loading: false, authenticated: true, sessionUnknown: false }, 'render'],
    [{ loading: false, authenticated: false, sessionUnknown: true }, 'retry'],
    [{ loading: false, authenticated: false, sessionUnknown: false }, 'redirect'],
  ] as const)('%o → %s', (state, expected) => {
    expect(authGuardDecision(state)).toBe(expected);
  });
});
