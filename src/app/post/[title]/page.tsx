import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { PostDetailsHomeView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Пост - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ title: string }>;
};

export default async function Page({ params }: Props) {
  const { title } = await params;

  return <PostDetailsHomeView title={title} />;
}
