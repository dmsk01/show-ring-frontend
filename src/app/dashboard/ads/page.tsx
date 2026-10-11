import { CONFIG } from 'src/global-config';

import { CampaignListView } from 'src/sections/ad/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Реклама | Кабинет - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="ads:view">
      <CampaignListView />
    </PermissionGuard>
  );
}
