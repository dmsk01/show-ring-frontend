import { CONFIG } from 'src/global-config';

import { MyShowsListView } from 'src/sections/my-show/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `My Shows | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="shows:view">
      <MyShowsListView />
    </PermissionGuard>
  );
}
