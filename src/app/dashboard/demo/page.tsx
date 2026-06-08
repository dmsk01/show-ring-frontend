import { CONFIG } from 'src/global-config';

import { DemoHubView } from 'src/sections/demo/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Demo | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="admin">
      <DemoHubView />
    </PermissionGuard>
  );
}
