import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';

import axios, { AxiosError } from 'axios';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';

import axiosInstance from '../axios';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-03: любой сбой refresh (429 лимита,
// 503, обрыв сети) выкидывал пользователя на страницу входа с живой сессией.

function httpError(config: InternalAxiosRequestConfig | undefined, status: number, detail: string) {
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
    status,
    statusText: '',
    headers: {},
    config: config as InternalAxiosRequestConfig,
    data: { detail },
  });
}

/** Адаптер: первый вызов — 401 (протухший access), дальше — 200. */
function expiredThenOk(): { adapter: AxiosAdapter; calls: () => number } {
  let calls = 0;
  const adapter: AxiosAdapter = async (config) => {
    calls += 1;
    if (calls === 1) throw httpError(config, 401, 'Not authenticated');
    return { data: { id: 'u1' }, status: 200, statusText: 'OK', headers: {}, config };
  };
  return { adapter, calls: () => calls };
}

const location = { pathname: '/dashboard/dogs/', search: '?page=2', href: '' };

beforeEach(() => {
  location.href = '';
  vi.stubGlobal('window', { location });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('401 interceptor', () => {
  it('replays the request after a successful refresh', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({ status: 200, data: {} });
    const { adapter, calls } = expiredThenOk();

    const res = await axiosInstance.get('/users/me', { adapter });

    expect(res.data).toEqual({ id: 'u1' });
    expect(calls()).toBe(2);
    expect(location.href).toBe('');
  });

  it('sends the user to sign-in when the refresh token is dead', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(
      httpError(undefined, 401, 'invalid_or_expired_token')
    );
    const { adapter } = expiredThenOk();

    await expect(axiosInstance.get('/users/me', { adapter })).rejects.toMatchObject({
      status: 401,
    });
    expect(location.href).toBe('/auth/jwt/sign-in?returnTo=%2Fdashboard%2Fdogs%2F%3Fpage%3D2');
  });

  it('keeps the user on the page when refresh is rate-limited (429)', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(httpError(undefined, 429, 'Too many requests'));
    const { adapter, calls } = expiredThenOk();

    await expect(axiosInstance.get('/users/me', { adapter })).rejects.toMatchObject({
      status: 429,
    });
    expect(location.href).toBe('');
    expect(calls()).toBe(1);
  });

  // FE-04: refresh одной кукой из двух вкладок. Наша получила
  // refresh_superseded, а новые куки от другой вкладки браузер применил чуть
  // позже — первый повтор ещё уходит со старой access-кукой и получает 401.
  it('retries once more when the other tab cookies arrive late (refresh_superseded)', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(httpError(undefined, 401, 'refresh_superseded'));
    let calls = 0;
    const adapter: AxiosAdapter = async (config) => {
      calls += 1;
      if (calls <= 2) throw httpError(config, 401, 'Not authenticated');
      return { data: { id: 'u1' }, status: 200, statusText: 'OK', headers: {}, config };
    };

    const res = await axiosInstance.get('/users/me', { adapter });

    expect(res.data).toEqual({ id: 'u1' });
    expect(calls).toBe(3);
    expect(location.href).toBe('');
  });

  it('gives up after the late-cookie retry if the session is still rejected', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(httpError(undefined, 401, 'refresh_superseded'));
    let calls = 0;
    const adapter: AxiosAdapter = async (config) => {
      calls += 1;
      throw httpError(config, 401, 'Not authenticated');
    };

    await expect(axiosInstance.get('/users/me', { adapter })).rejects.toMatchObject({
      status: 401,
    });
    expect(calls).toBe(3);
  });

  it('keeps the user on the page when the network is down during refresh', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    const { adapter } = expiredThenOk();

    await expect(axiosInstance.get('/users/me', { adapter })).rejects.toBeInstanceOf(Error);
    expect(location.href).toBe('');
  });
});
