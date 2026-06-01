import { CONFIG } from 'src/global-config';

import { KennelListView } from 'src/sections/kennel/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Kennels | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="kennels:view">
      <KennelListView />
    </PermissionGuard>
  );
}
