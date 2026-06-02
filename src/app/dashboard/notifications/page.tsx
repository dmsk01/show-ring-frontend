import { CONFIG } from 'src/global-config';

import { NotificationsView } from 'src/sections/notification/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Notifications | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="dashboard:view">
      <NotificationsView />
    </PermissionGuard>
  );
}
