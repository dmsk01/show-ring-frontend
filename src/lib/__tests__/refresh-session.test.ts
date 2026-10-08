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
    expect(await refreshSession()).toBe(true);
  });

  // Ревью 2026-10-06, BE-27: другая вкладка уже обновила сессию и поставила
  // браузеру новые куки — исходный запрос нужно просто повторить, а не
  // выкидывать пользователя на страницу входа.
  it('treats refresh_superseded as success', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(httpError(401, 'refresh_superseded'));
    expect(await refreshSession()).toBe(true);
  });

  it('fails on other refresh errors', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(httpError(401, 'invalid_or_expired_token'));
    expect(await refreshSession()).toBe(false);
  });
});
