import { CONFIG } from 'src/global-config';

import { DogListView } from 'src/sections/dog/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Dogs | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="dogs:view">
      <DogListView />
    </PermissionGuard>
  );
}
