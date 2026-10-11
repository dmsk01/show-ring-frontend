import type { Metadata } from 'next';

import { fetchPublic, kennelMetadata } from 'src/utils/page-metadata';

import { KennelDetailView } from 'src/sections/kennel/view';

// ----------------------------------------------------------------------

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // Заголовок и описание из данных API — для поиска и превью ссылок (FE-24).
  return kennelMetadata(await fetchPublic(`/kennels/${id}`));
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <KennelDetailView id={id} />;
}
