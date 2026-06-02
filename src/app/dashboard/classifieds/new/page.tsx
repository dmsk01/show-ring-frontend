import { CONFIG } from 'src/global-config';

import { ClassifiedCreateView } from 'src/sections/classified/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Create classified | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="classifieds:create">
      <ClassifiedCreateView />
    </PermissionGuard>
  );
}
