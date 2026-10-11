import { CONFIG } from 'src/global-config';

import { KennelCreateView } from 'src/sections/kennel/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Новый питомник | Кабинет - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="kennels:create">
      <KennelCreateView />
    </PermissionGuard>
  );
}
