import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ContactView } from 'src/sections/contact/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Контакты - ${CONFIG.appName}` };

export default function Page() {
  return <ContactView />;
}
