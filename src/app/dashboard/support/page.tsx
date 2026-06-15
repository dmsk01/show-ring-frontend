import { CONFIG } from 'src/global-config';
import { FeatureGuard } from 'src/feature-flags';

import { TicketListView } from 'src/sections/support/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Support | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <FeatureGuard flag="support">
      <PermissionGuard permission="support:view">
        <TicketListView />
      </PermissionGuard>
    </FeatureGuard>
  );
}
