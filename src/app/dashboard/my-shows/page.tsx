import { CONFIG } from 'src/global-config';

import { MyShowsListView } from 'src/sections/my-show/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Мои выставки | Кабинет - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionGuard permission="shows:view">
      <MyShowsListView />
    </PermissionGuard>
  );
}
