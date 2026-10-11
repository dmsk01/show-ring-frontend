import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AboutView } from 'src/sections/about/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `О нас - ${CONFIG.appName}` };

export default function Page() {
  return <AboutView />;
}
