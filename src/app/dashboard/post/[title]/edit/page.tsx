import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { PostEditView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Редактирование поста | Кабинет - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ title: string }>;
};

export default async function Page({ params }: Props) {
  const { title } = await params;

  return <PostEditView title={title} />;
}
