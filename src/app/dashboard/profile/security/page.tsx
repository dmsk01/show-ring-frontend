import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProfileSecurityForm } from 'src/sections/profile/profile-security-form';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Безопасность | ${CONFIG.appName}` };

export default function Page() {
  return <ProfileSecurityForm />;
}
