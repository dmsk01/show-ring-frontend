// ----------------------------------------------------------------------
// Cookie-режим: access/refresh живут в httpOnly-куках, JS их не читает и не
// хранит. Поэтому здесь нет setSession/localStorage — только утилиты разбора
// JWT (на случай, если где-то понадобится прочитать claims из не-httpOnly
// токена, например в body-режиме мобильного клиента).

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
