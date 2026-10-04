import { CONFIG } from 'src/global-config';

import { ShowStaffView } from 'src/sections/checkin/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Show staff | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="shows:view">
      <ShowStaffView id={id} />
    </PermissionGuard>
  );
}
