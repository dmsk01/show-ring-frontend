import { cookies } from 'next/headers';

import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_VALUE } from './config';

// ----------------------------------------------------------------------

/**
 * Reads the cookie-consent flag on the server (App Router) so the banner does
 * not flash on first paint when consent was already given. Mirrors the
 * `detectSettings()` pattern used by the settings provider.
 */
export async function detectCookieConsent(): Promise<boolean> {
  const cookieStore = await cookies();

  return cookieStore.get(COOKIE_CONSENT_KEY)?.value === COOKIE_CONSENT_VALUE;
}
