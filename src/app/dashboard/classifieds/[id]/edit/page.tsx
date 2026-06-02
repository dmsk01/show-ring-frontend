import { CONFIG } from 'src/global-config';

import { ClassifiedEditView } from 'src/sections/classified/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit classified | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="classifieds:edit">
      <ClassifiedEditView id={id} />
    </PermissionGuard>
  );
}
