import { it, expect, describe } from 'vitest';

import { signInRedirectPath } from '../guard/sign-in-redirect';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-06: AuthGuard терял query-строку в returnTo.

describe('signInRedirectPath', () => {
  it('keeps the query string of the protected page', () => {
    expect(signInRedirectPath('/auth/jwt/sign-in', '/dashboard/my-shows/1', '?tab=ticket')).toBe(
      '/auth/jwt/sign-in?returnTo=%2Fdashboard%2Fmy-shows%2F1%3Ftab%3Dticket'
    );
  });

  it('works without a query string', () => {
    expect(signInRedirectPath('/auth/jwt/sign-in', '/dashboard/dogs', '')).toBe(
      '/auth/jwt/sign-in?returnTo=%2Fdashboard%2Fdogs'
    );
  });
});
