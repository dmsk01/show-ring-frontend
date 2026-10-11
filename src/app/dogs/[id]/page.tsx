import type { Metadata } from 'next';

import { dogMetadata, fetchPublic } from 'src/utils/page-metadata';

import { DogPublicDetailView } from 'src/sections/dog/view';

// ----------------------------------------------------------------------

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // Заголовок и описание из данных API — для поиска и превью ссылок (FE-24).
  return dogMetadata(await fetchPublic(`/dogs/${id}`));
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <DogPublicDetailView id={id} />;
}
