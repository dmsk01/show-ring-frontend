import { CONFIG } from 'src/global-config';

import { ShowDocumentsView } from 'src/sections/show/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Show documents | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="shows:view">
      <ShowDocumentsView id={id} />
    </PermissionGuard>
  );
}
