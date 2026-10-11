import type { Metadata } from 'next';

import { fetchPublic, showMetadata } from 'src/utils/page-metadata';

import { ShowPublicDetailView } from 'src/sections/show/view';

// ----------------------------------------------------------------------

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // Заголовок и описание из данных API — для поиска и превью ссылок (FE-24).
  return showMetadata(await fetchPublic(`/shows/${id}`));
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ShowPublicDetailView id={id} />;
}
