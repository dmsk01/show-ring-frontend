import { it, vi, expect, describe } from 'vitest';

import { saveDogWithPhotos } from '../save-dog';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-17: собака создавалась, загрузка фото
// падала (413/429/503), форма оставалась в режиме «новая собака» — повторная
// отправка создавала дубль.

const file = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

function deps(overrides: Partial<Parameters<typeof saveDogWithPhotos>[0]['api']> = {}) {
  return {
    createDog: vi.fn(async () => ({ id: 'dog-1', avatar_file_id: null })),
    updateDog: vi.fn(async (id: string) => ({ id, avatar_file_id: 'f0' })),
    uploadFile: vi.fn(async (f: File) => ({ id: `file-${f.name}` })),
    addDogImages: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('saveDogWithPhotos', () => {
  it('creates the dog once and reports a photo upload failure without losing the dog', async () => {
    const api = deps({
      uploadFile: vi.fn(async () => Promise.reject(new Error('upload_too_large'))),
    });

    const result = await saveDogWithPhotos({
      api,
      payload: { name: 'Рекс' },
      newFiles: [file('a.jpg')],
    });

    expect(api.createDog).toHaveBeenCalledTimes(1);
    expect(result.dog.id).toBe('dog-1');
    expect(result.photoError).toBeInstanceOf(Error);
    expect(api.addDogImages).not.toHaveBeenCalled();
  });

  it('attaches photos and makes the first one the avatar for a new dog', async () => {
    const api = deps();

    const result = await saveDogWithPhotos({
      api,
      payload: { name: 'Рекс' },
      newFiles: [file('a.jpg'), file('b.jpg')],
    });

    expect(result.photoError).toBeNull();
    expect(api.addDogImages).toHaveBeenCalledWith('dog-1', [
      { file_id: 'file-a.jpg', position: 0, is_primary: true },
      { file_id: 'file-b.jpg', position: 1, is_primary: false },
    ]);
  });

  it('updates an existing dog and keeps its avatar', async () => {
    const api = deps();

    await saveDogWithPhotos({
      api,
      currentDogId: 'dog-9',
      payload: { name: 'Рекс' },
      newFiles: [file('c.jpg')],
    });

    expect(api.createDog).not.toHaveBeenCalled();
    expect(api.updateDog).toHaveBeenCalledWith('dog-9', { name: 'Рекс' });
    expect(api.addDogImages).toHaveBeenCalledWith('dog-9', [
      { file_id: 'file-c.jpg', position: 0, is_primary: false },
    ]);
  });

  it('propagates a failure of the dog save itself', async () => {
    const api = deps({ createDog: vi.fn(async () => Promise.reject(new Error('forbidden'))) });

    await expect(
      saveDogWithPhotos({ api, payload: { name: 'Рекс' }, newFiles: [] })
    ).rejects.toThrow('forbidden');
  });
});
