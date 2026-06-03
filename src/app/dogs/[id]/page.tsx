import { CONFIG } from 'src/global-config';

import { DogPublicDetailView } from 'src/sections/dog/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Собака - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <DogPublicDetailView id={id} />;
}
