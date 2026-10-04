import { CONFIG } from 'src/global-config';

import { PrecheckView } from 'src/sections/checkin/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Documents pre-check | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="shows:view">
      <PrecheckView id={id} />
    </PermissionGuard>
  );
}
