import axios from 'src/lib/axios';

import { JWT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export function jwtDecode(token: string) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) throw new Error('Invalid token!');
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken: string) {
  if (!accessToken) return false;
  const decoded = jwtDecode(accessToken);
  if (!decoded || !('exp' in decoded)) return false;
  return decoded.exp > Date.now() / 1000;
}

// ----------------------------------------------------------------------

export function setSession(accessToken: string | null) {
  if (accessToken) {
    localStorage.setItem(JWT_STORAGE_KEY, accessToken);
    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    localStorage.removeItem(JWT_STORAGE_KEY);
    delete axios.defaults.headers.common.Authorization;
  }
}
