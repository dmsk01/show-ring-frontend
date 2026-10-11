import { fileUrl } from 'src/actions/file';

// ----------------------------------------------------------------------

/**
 * Загрузить картинку для поста и вернуть адрес на своём сайте (/api/files/…).
 * Внешние URL не вставляем: CSP (img-src 'self') не даст их загрузить на
 * опубликованной странице (ревью 2026-10-09, FE-25).
 */
export async function uploadEditorImage(
  file: File,
  upload: (file: File) => Promise<{ id: string }>
): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('not_an_image');
  const { id } = await upload(file);
  return fileUrl(id);
}
