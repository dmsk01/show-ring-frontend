import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ConfirmEmailChangeView } from 'src/auth/view/confirm-email-change-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Подтверждение смены email | ${CONFIG.appName}` };

export default function Page() {
  return <ConfirmEmailChangeView />;
}
