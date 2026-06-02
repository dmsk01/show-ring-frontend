import { CONFIG } from 'src/global-config';

import { ShowEditView } from 'src/sections/show/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit show | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="shows:edit">
      <ShowEditView id={id} />
    </PermissionGuard>
  );
}
