import { CONFIG } from 'src/global-config';

import { LitterListView } from 'src/sections/litter/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Litters | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="litters:view">
      <LitterListView />
    </PermissionGuard>
  );
}
