import { CONFIG } from 'src/global-config';

import { TicketListView } from 'src/sections/support/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Support | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="support:view">
      <TicketListView />
    </PermissionGuard>
  );
}
