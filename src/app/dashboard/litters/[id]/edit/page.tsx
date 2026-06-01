import { CONFIG } from 'src/global-config';

import { LitterEditView } from 'src/sections/litter/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit litter | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGuard permission="litters:edit">
      <LitterEditView id={id} />
    </PermissionGuard>
  );
}
