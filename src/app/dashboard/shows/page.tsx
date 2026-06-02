import { CONFIG } from 'src/global-config';

import { ShowListView } from 'src/sections/show/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Shows | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="shows:view">
      <ShowListView />
    </PermissionGuard>
  );
}
