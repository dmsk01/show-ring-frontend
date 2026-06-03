import { CONFIG } from 'src/global-config';

import { ClassifiedDetailView } from 'src/sections/classified/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Объявление - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ClassifiedDetailView id={id} />;
}
