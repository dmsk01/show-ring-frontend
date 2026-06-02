import { CONFIG } from 'src/global-config';

import { ShowResultsView } from 'src/sections/show/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Show results | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="shows:view">
      <ShowResultsView id={id} />
    </PermissionGuard>
  );
}
