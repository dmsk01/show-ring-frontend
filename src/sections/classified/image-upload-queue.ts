// ----------------------------------------------------------------------

export type ImageUploadState = { files: File[]; ids: string[]; uploading: boolean };

/**
 * Очередь загрузки фото объявления вне React-состояния. Каждый дроп
 * дописывает результат к ТЕКУЩЕМУ состоянию, а не к снимку на момент
 * дропа: раньше два быстрых дропа затирали друг друга (ревью 2026-10-09,
 * FE-32). `uploading` — пока идёт хоть одна загрузка; форма блокирует
 * отправку, иначе объявление уходило без фото.
 */
export function createImageUploadQueue(
  upload: (file: File) => Promise<{ id: string }>,
  onChange: (state: ImageUploadState) => void
) {
  let files: File[] = [];
  let ids: string[] = [];
  let active = 0;

  const getState = (): ImageUploadState => ({ files, ids, uploading: active > 0 });
  const emit = () => onChange(getState());

  /** Загрузить файлы; вернуть первую ошибку (для тоста) или null. */
  async function add(accepted: File[]): Promise<unknown> {
    active += 1;
    emit();
    try {
      const results = await Promise.allSettled(accepted.map((f) => upload(f)));
      let failure: unknown = null;
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          files = [...files, accepted[i]];
          ids = [...ids, res.value.id];
        } else if (failure === null) {
          failure = res.reason;
        }
      });
      return failure;
    } finally {
      active -= 1;
      emit();
    }
  }

  function remove(target: File): void {
    const index = files.indexOf(target);
    if (index < 0) return;
    files = files.filter((_, i) => i !== index);
    ids = ids.filter((_, i) => i !== index);
    emit();
  }

  function clear(): void {
    files = [];
    ids = [];
    emit();
  }

  return { add, remove, clear, getState };
}
