import axios from 'axios';
import { it, vi, expect, describe, afterEach } from 'vitest';

import { refreshSession } from '../axios';

// ----------------------------------------------------------------------

function httpError(status: number, detail: string) {
  return Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response: { status, data: { detail } },
  });
}

describe('refreshSession', () => {
  afterEach(() => vi.restoreAllMocks());

  it('succeeds when the backend rotated the session', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({ status: 200, data: {} });
    expect((await refreshSession()).outcome).toBe('ok');
  });

  // Ревью 2026-10-06, BE-27: другая вкладка уже обновила сессию и поставила
  // браузеру новые куки — исходный запрос нужно просто повторить, а не
  // выкидывать пользователя на страницу входа.
  // FE-04: куки другой вкладки могут прийти чуть позже — повтор исходного
  // запроса делает интерсептор, поэтому итог отдельный.
  it('reports refresh_superseded separately from own rotation', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(httpError(401, 'refresh_superseded'));
    expect((await refreshSession()).outcome).toBe('superseded');
  });

  it('reports a dead session on other 401 refresh errors', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(httpError(401, 'invalid_or_expired_token'));
    expect((await refreshSession()).outcome).toBe('dead');
  });

  // Ревью фронтенда 2026-10-09, FE-03: лимит, сбой сервера и обрыв сети —
  // не повод считать сессию мёртвой.
  it.each([
    ['rate limit', httpError(429, 'Too many requests')],
    ['server error', httpError(503, 'rate limit subsystem unavailable')],
    ['network error', Object.assign(new Error('Network Error'), { isAxiosError: true })],
  ])('reports a transient failure on %s', async (_name, error) => {
    vi.spyOn(axios, 'post').mockRejectedValue(error);
    const result = await refreshSession();
    expect(result.outcome).toBe('transient');
  });
});
