import { CONFIG } from 'src/global-config';

import { MyShowDetailView } from 'src/sections/my-show/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `My Show | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="shows:view">
      <MyShowDetailView id={id} />
    </PermissionGuard>
  );
}
