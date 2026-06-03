import { CONFIG } from 'src/global-config';

import { ShowPublicDetailView } from 'src/sections/show/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Выставка - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ShowPublicDetailView id={id} />;
}
