import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { PostListHomeView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Блог - ${CONFIG.appName}` };

export default function Page() {
  return <PostListHomeView />;
}
