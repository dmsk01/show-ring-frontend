import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { LegalDocumentView } from 'src/sections/legal/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Политика конфиденциальности - ${CONFIG.appName}` };

export default function Page() {
  return <LegalDocumentView documentKey="privacy" />;
}
