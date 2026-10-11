import { it, expect, describe } from 'vitest';

import { uploadEditorImage } from '../upload-editor-image';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-25: картинка вставлялась по внешнему URL,
// а CSP (img-src 'self') не давал её загрузить на опубликованной странице.
// Теперь файл загружается в /files и вставляется по адресу своего сайта.

const image = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

describe('uploadEditorImage', () => {
  it('uploads the file and returns a same-origin src', async () => {
    const src = await uploadEditorImage(image, async () => ({ id: 'abc' }));
    expect(src).toBe('/api/files/abc');
    expect(new URL(src, 'https://showring.app').origin).toBe('https://showring.app');
  });

  it('rejects non-image files without uploading', async () => {
    let uploaded = false;
    const pdf = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    await expect(
      uploadEditorImage(pdf, async () => {
        uploaded = true;
        return { id: 'x' };
      })
    ).rejects.toThrow('not_an_image');
    expect(uploaded).toBe(false);
  });
});
