import { CONFIG } from 'src/global-config';

import { ModerationView } from 'src/sections/admin/moderation/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Moderation | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="admin">
      <ModerationView />
    </PermissionGuard>
  );
}
