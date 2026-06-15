import { test, expect } from '@playwright/test';

// ----------------------------------------------------------------------
// Feature flags — gating of the Support feature.
//
// Backend `GET /feature-flags` has NO `support` key (closed enum: only
// official_documents / phone_otp_auth). Under fail-closed semantics that hides
// Support everywhere. Admin (admin storageState) holds `support:view`, so
// WITHOUT the flag they would normally see the section — making this a clean
// proof that the flag, not permissions, is doing the hiding.
//
// Selectors are href-based (locale-independent). Requires backend :8000.
// ----------------------------------------------------------------------

const SUPPORT_PATH = '/dashboard/support';

test('Support nav item is hidden (flag absent → fail-closed)', async ({ page }) => {
  await page.goto('/dashboard/dogs');

  // Positive control: the nav rendered and admin sees a non-flagged item.
  await expect(page.locator('a[href="/dashboard/dogs"]').first()).toBeVisible();

  // The flagged Support item must not be in the navigation.
  await expect(page.locator(`a[href="${SUPPORT_PATH}"]`)).toHaveCount(0);
});

test('Deep-link to /dashboard/support redirects to 404 (FeatureGuard)', async ({ page }) => {
  await page.goto(SUPPORT_PATH);
  await expect(page).toHaveURL(/\/error\/404/);
});
