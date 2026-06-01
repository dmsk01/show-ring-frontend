import { CONFIG } from 'src/global-config';

import { KennelEditView } from 'src/sections/kennel/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit kennel | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="kennels:edit">
      <KennelEditView id={id} />
    </PermissionGuard>
  );
}
