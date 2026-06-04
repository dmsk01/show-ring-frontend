import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProfilePlaceholder } from 'src/sections/profile/profile-placeholder';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Соцсети | ${CONFIG.appName}` };

export default function Page() {
  return <ProfilePlaceholder />;
}
