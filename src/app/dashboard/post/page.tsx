import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { PostListView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Блог | Кабинет - ${CONFIG.appName}` };

export default function Page() {
  return <PostListView />;
}
