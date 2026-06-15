// ----------------------------------------------------------------------
// Клиентский гейт и сжатие загрузок. Зеркалит лимиты бэка (10 МБ, разрешённые
// типы по магическим байтам) и ужимает фото до цели ~2 МБ, чтобы не грузить
// бэкенд лишними байтами. Браузер-онли (canvas / createImageBitmap) — вызывать
// только из 'use client' кода.
// ----------------------------------------------------------------------

/** Жёсткий потолок бэка (`max_upload_size_bytes`). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Цель сжатия фото. Файл ≤ этого размера не пережимаем. */
export const TARGET_IMAGE_BYTES = 2 * 1024 * 1024;

/** Максимальная длинная сторона после ресайза, px. */
export const MAX_IMAGE_EDGE = 2048;

/** Разрешённые типы изображений (зеркало магических байтов бэка). */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Разрешённые типы документов. */
export const ALLOWED_DOC_TYPES = ['application/pdf'];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

export type UploadRejection = 'unsupported_type' | 'file_too_large';

/**
 * Причина клиентского отказа ДО отправки на бэк, либо null если файл проходит.
 * Чистая функция — юнит-тестируема.
 */
export function getUploadRejection(file: File): UploadRejection | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'unsupported_type';
  if (file.size > MAX_UPLOAD_BYTES) return 'file_too_large';
  return null;
}

/**
 * Стоит ли пытаться сжать файл. GIF исключён (canvas убил бы анимацию), pdf и
 * прочее — не изображения. Уже маленькие фото не трогаем.
 */
export function isCompressibleImage(file: File): boolean {
  const compressible = ['image/jpeg', 'image/png', 'image/webp'];
  return compressible.includes(file.type) && file.size > TARGET_IMAGE_BYTES;
}

function targetDimensions(width: number, height: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= MAX_IMAGE_EDGE) return { width, height };
  const scale = MAX_IMAGE_EDGE / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Ужимает изображение до цели ~2 МБ: ресайз длинной стороны до MAX_IMAGE_EDGE и
 * переэнкод в webp с понижением качества. Если дотянуть до цели не вышло, но
 * результат меньше оригинала — отдаём его; иначе возвращаем исходный файл
 * (не блокируем пользователя). Не-сжимаемые файлы возвращаются как есть.
 */
export async function compressImageFile(file: File): Promise<File> {
  if (!isCompressibleImage(file)) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file; // декодирование не удалось — пусть бэк решает
  }

  try {
    const { width, height } = targetDimensions(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    let best: Blob | null = null;
    for (const quality of [0.82, 0.72, 0.62, 0.5]) {
       
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/webp', quality);
      });
      if (!blob) break;
      best = blob;
      if (blob.size <= TARGET_IMAGE_BYTES) break;
    }

    if (!best || best.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([best], `${name}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
