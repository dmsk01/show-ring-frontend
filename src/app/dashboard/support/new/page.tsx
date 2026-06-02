import { CONFIG } from 'src/global-config';

import { TicketCreateView } from 'src/sections/support/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `New ticket | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="support:create">
      <TicketCreateView />
    </PermissionGuard>
  );
}
