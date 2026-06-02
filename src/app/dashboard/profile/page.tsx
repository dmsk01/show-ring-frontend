import { CONFIG } from 'src/global-config';

import { ProfileView } from 'src/sections/profile';

// ----------------------------------------------------------------------

export const metadata = { title: `My profile | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <ProfileView />;
}
