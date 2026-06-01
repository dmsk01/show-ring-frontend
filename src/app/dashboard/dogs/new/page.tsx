import { CONFIG } from 'src/global-config';

import { DogCreateView } from 'src/sections/dog/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Create dog | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="dogs:create">
      <DogCreateView />
    </PermissionGuard>
  );
}
