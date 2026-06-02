import { CONFIG } from 'src/global-config';

import { CampaignCreateView } from 'src/sections/ad/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Create campaign | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="ads:create">
      <CampaignCreateView />
    </PermissionGuard>
  );
}
