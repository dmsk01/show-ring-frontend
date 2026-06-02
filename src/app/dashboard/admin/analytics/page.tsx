import { CONFIG } from 'src/global-config';

import { AdminAnalyticsView } from 'src/sections/admin/analytics/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Analytics | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="admin">
      <AdminAnalyticsView />
    </PermissionGuard>
  );
}
