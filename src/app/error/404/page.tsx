import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { NotFoundView } from 'src/sections/error';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Страница не найдена - ${CONFIG.appName}` };

export default function Page() {
  return <NotFoundView />;
}
