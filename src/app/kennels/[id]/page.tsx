import { CONFIG } from 'src/global-config';

import { KennelDetailView } from 'src/sections/kennel/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Питомник - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <KennelDetailView id={id} />;
}
