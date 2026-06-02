import { CONFIG } from 'src/global-config';

import { AdminUsersView } from 'src/sections/admin/manage/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Users | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="admin">
      <AdminUsersView />
    </PermissionGuard>
  );
}
