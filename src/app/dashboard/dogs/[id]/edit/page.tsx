import { CONFIG } from 'src/global-config';

import { DogEditView } from 'src/sections/dog/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit dog | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

// Доступ ownership-aware (Dog.owner_id) — решает вьюха после загрузки собаки:
// статический PermissionGuard владельца не знает. Auth обеспечивает
// AuthGuard дашборд-layout'а.
export default async function Page({ params }: Props) {
  const { id } = await params;
  return <DogEditView id={id} />;
}
