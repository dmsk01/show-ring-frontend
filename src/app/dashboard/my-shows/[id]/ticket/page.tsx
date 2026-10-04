import { CONFIG } from 'src/global-config';

import { MyTicketView } from 'src/sections/checkin/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `My ticket | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="shows:view">
      <MyTicketView id={id} />
    </PermissionGuard>
  );
}
