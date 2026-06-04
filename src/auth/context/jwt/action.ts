'use client';

import axios, { endpoints } from 'src/lib/axios';

import { setSession } from './utils';
import { JWT_REFRESH_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export type SignInParams = { email: string; password: string };
export type SignUpParams = { email: string; password: string };

function storeTokens(data: { access_token?: string; refresh_token?: string }) {
  const { access_token, refresh_token } = data;
  if (!access_token) throw new Error('Access token not found in response');
  setSession(access_token);
  if (refresh_token) localStorage.setItem(JWT_REFRESH_STORAGE_KEY, refresh_token);
}

/** Sign in — POST /auth/login → { access_token, refresh_token, token_type } */
export const signInWithPassword = async ({ email, password }: SignInParams): Promise<void> => {
  const res = await axios.post(endpoints.auth.signIn, { email, password });
  storeTokens(res.data);
};

/** Sign up — POST /auth/register (same token shape) */
export const signUp = async ({ email, password }: SignUpParams): Promise<void> => {
  const res = await axios.post(endpoints.auth.signUp, { email, password });
  storeTokens(res.data);
};

/** Sign out — best-effort backend logout (revokes the refresh token), then clear local session */
export const signOut = async (): Promise<void> => {
  try {
    const refreshToken = localStorage.getItem(JWT_REFRESH_STORAGE_KEY);
    // Backend requires { refresh_token } to revoke it; skip the call if we don't have one.
    if (refreshToken) {
      await axios.post(endpoints.auth.logout, { refresh_token: refreshToken });
    }
  } catch {
    // ignore network/401 on logout
  } finally {
    setSession(null);
    localStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
  }
};
