import { CONFIG } from 'src/global-config';

import { DogEditView } from 'src/sections/dog/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit dog | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="dogs:edit">
      <DogEditView id={id} />
    </PermissionGuard>
  );
}
