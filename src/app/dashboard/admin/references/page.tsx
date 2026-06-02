import { CONFIG } from 'src/global-config';

import { AdminReferencesView } from 'src/sections/admin/reference/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `References | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="references:edit">
      <AdminReferencesView />
    </PermissionGuard>
  );
}
