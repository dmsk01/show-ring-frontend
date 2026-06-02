import { CONFIG } from 'src/global-config';

import { ClassifiedListView } from 'src/sections/classified/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Classifieds | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="classifieds:view">
      <ClassifiedListView />
    </PermissionGuard>
  );
}
