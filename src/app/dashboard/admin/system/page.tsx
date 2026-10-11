import { CONFIG } from 'src/global-config';

import { AdminSystemView } from 'src/sections/admin/system/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Система | Кабинет - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="admin">
      <AdminSystemView />
    </PermissionGuard>
  );
}
