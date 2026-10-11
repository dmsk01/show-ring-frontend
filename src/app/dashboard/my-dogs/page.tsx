import { CONFIG } from 'src/global-config';

import { MyDogsView } from 'src/sections/dog/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Мои собаки | Кабинет - ${CONFIG.appName}` };

// Личный раздел: PermissionGuard не нужен — свои собаки видит каждая роль.
// Auth обеспечивает AuthGuard дашборд-layout'а.
export default function Page() {
  return <MyDogsView />;
}
