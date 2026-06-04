import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProfileFeedbackForm } from 'src/sections/profile/profile-feedback-form';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Обратная связь | ${CONFIG.appName}` };

export default function Page() {
  return <ProfileFeedbackForm />;
}
