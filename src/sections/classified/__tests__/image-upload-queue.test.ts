import { it, expect, describe } from 'vitest';

import { createImageUploadQueue } from '../image-upload-queue';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-32: два быстрых дропа стартовали с одним и
// тем же состоянием, и последний завершившийся затирал результат первого.

const file = (name: string) => new File(['x'], name, { type: 'image/png' });

function deferredUpload() {
  const pending = new Map<string, (id: string) => void>();
  const upload = (f: File) =>
    new Promise<{ id: string }>((resolve) => {
      pending.set(f.name, (id) => resolve({ id }));
    });
  return { upload, finish: (name: string, id: string) => pending.get(name)!(id) };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('createImageUploadQueue', () => {
  it('keeps files from two overlapping drops when they finish out of order', async () => {
    const { upload, finish } = deferredUpload();
    const states: { ids: string[]; uploading: boolean }[] = [];
    const queue = createImageUploadQueue(upload, (s) =>
      states.push({ ids: s.ids, uploading: s.uploading })
    );

    const first = queue.add([file('a.png')]);
    const second = queue.add([file('b.png')]);
    expect(queue.getState().uploading).toBe(true);

    finish('b.png', 'id-b');
    await tick();
    finish('a.png', 'id-a');
    await Promise.all([first, second]);

    expect([...queue.getState().ids].sort()).toEqual(['id-a', 'id-b']);
    expect(queue.getState().uploading).toBe(false);
    expect(states.at(-1)).toEqual({ ids: queue.getState().ids, uploading: false });
  });

  it('reports the first failure and keeps successful files', async () => {
    const queue = createImageUploadQueue(
      async (f) => {
        if (f.name === 'bad.png') throw new Error('upload_too_large');
        return { id: `id-${f.name}` };
      },
      () => {}
    );

    const failure = await queue.add([file('ok.png'), file('bad.png')]);

    expect(failure).toBeInstanceOf(Error);
    expect(queue.getState().ids).toEqual(['id-ok.png']);
  });

  it('removes a file together with its id', async () => {
    const queue = createImageUploadQueue(
      async (f) => ({ id: `id-${f.name}` }),
      () => {}
    );
    const a = file('a.png');
    await queue.add([a, file('b.png')]);

    queue.remove(a);

    expect(queue.getState().ids).toEqual(['id-b.png']);
    expect(queue.getState().files.map((f) => f.name)).toEqual(['b.png']);
  });
});
