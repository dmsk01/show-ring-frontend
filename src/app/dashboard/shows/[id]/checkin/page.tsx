import { CONFIG } from 'src/global-config';

import { CheckinDeskView } from 'src/sections/checkin/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Check-in desk | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="shows:view">
      <CheckinDeskView id={id} />
    </PermissionGuard>
  );
}
