import { CONFIG } from 'src/global-config';

import { CampaignEditView } from 'src/sections/ad/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit campaign | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="ads:edit">
      <CampaignEditView id={id} />
    </PermissionGuard>
  );
}
