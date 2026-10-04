import { CONFIG } from 'src/global-config';

import { StaffShowsView } from 'src/sections/checkin/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Show check-in | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="dashboard:view">
      <StaffShowsView />
    </PermissionGuard>
  );
}
