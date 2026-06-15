import { it, expect, describe } from 'vitest';

import {
  MAX_UPLOAD_BYTES,
  getUploadRejection,
  TARGET_IMAGE_BYTES,
  isCompressibleImage,
} from '../upload-image';

// File с заданным типом/размером без реальных байтов: переопределяем size.
function fakeFile(type: string, size: number, name = 'f'): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('getUploadRejection', () => {
  it('accepts allowed image types under the cap', () => {
    expect(getUploadRejection(fakeFile('image/jpeg', 1024))).toBeNull();
    expect(getUploadRejection(fakeFile('image/png', 1024))).toBeNull();
    expect(getUploadRejection(fakeFile('image/webp', 1024))).toBeNull();
    expect(getUploadRejection(fakeFile('image/gif', 1024))).toBeNull();
  });

  it('accepts pdf documents', () => {
    expect(getUploadRejection(fakeFile('application/pdf', 1024))).toBeNull();
  });

  it('rejects disallowed types before checking size', () => {
    expect(getUploadRejection(fakeFile('image/svg+xml', 1024))).toBe('unsupported_type');
    expect(getUploadRejection(fakeFile('text/plain', 1024))).toBe('unsupported_type');
    expect(getUploadRejection(fakeFile('video/mp4', MAX_UPLOAD_BYTES + 1))).toBe('unsupported_type');
  });

  it('rejects allowed types over the 10 MB cap', () => {
    expect(getUploadRejection(fakeFile('image/jpeg', MAX_UPLOAD_BYTES + 1))).toBe('file_too_large');
  });

  it('accepts a file exactly at the cap', () => {
    expect(getUploadRejection(fakeFile('image/jpeg', MAX_UPLOAD_BYTES))).toBeNull();
  });
});

describe('isCompressibleImage', () => {
  it('is true for large jpeg/png/webp', () => {
    expect(isCompressibleImage(fakeFile('image/jpeg', TARGET_IMAGE_BYTES + 1))).toBe(true);
    expect(isCompressibleImage(fakeFile('image/png', TARGET_IMAGE_BYTES + 1))).toBe(true);
    expect(isCompressibleImage(fakeFile('image/webp', TARGET_IMAGE_BYTES + 1))).toBe(true);
  });

  it('is false for small images, gif, and pdf', () => {
    expect(isCompressibleImage(fakeFile('image/jpeg', TARGET_IMAGE_BYTES))).toBe(false);
    expect(isCompressibleImage(fakeFile('image/gif', TARGET_IMAGE_BYTES + 1))).toBe(false);
    expect(isCompressibleImage(fakeFile('application/pdf', TARGET_IMAGE_BYTES + 1))).toBe(false);
  });
});
