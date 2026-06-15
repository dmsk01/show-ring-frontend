import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProfileSocialsForm } from 'src/sections/profile/profile-socials-form';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Соцсети | ${CONFIG.appName}` };

export default function Page() {
  return <ProfileSocialsForm />;
}
