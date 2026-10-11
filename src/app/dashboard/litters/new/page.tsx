import { CONFIG } from 'src/global-config';

import { LitterCreateView } from 'src/sections/litter/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Новый помёт | Кабинет - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="litters:create">
      <LitterCreateView />
    </PermissionGuard>
  );
}
