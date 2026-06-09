import { CONFIG } from 'src/global-config';

import { LitterDetailView } from 'src/sections/litter/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Помёт - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <LitterDetailView id={id} />;
}
