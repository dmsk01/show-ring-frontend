import { CONFIG } from 'src/global-config';

import { ProfileView } from 'src/sections/profile';

// ----------------------------------------------------------------------

export const metadata = { title: `Мой профиль | Кабинет - ${CONFIG.appName}` };

export default function Page() {
  return <ProfileView />;
}
