import { CONFIG } from 'src/global-config';

import { ShowCreateView } from 'src/sections/show/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Create show | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="shows:create">
      <ShowCreateView />
    </PermissionGuard>
  );
}
