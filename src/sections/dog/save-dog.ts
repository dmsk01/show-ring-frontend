// ----------------------------------------------------------------------

type SavedDog = { id: string; avatar_file_id: string | null };

type DogImage = { file_id: string; position: number; is_primary: boolean };

export type SaveDogApi<P> = {
  createDog: (payload: P) => Promise<SavedDog>;
  updateDog: (id: string, payload: P) => Promise<SavedDog>;
  uploadFile: (file: File) => Promise<{ id: string }>;
  addDogImages: (dogId: string, images: DogImage[]) => Promise<unknown>;
};

/**
 * Сохранить собаку и прикрепить новые фото. Сбой загрузки фото НЕ отменяет
 * уже сохранённую собаку: возвращаем её вместе с `photoError`, чтобы форма
 * ушла на страницу правки, а не создавала собаку повторно (ревью
 * 2026-10-09, FE-17). Сбой самого сохранения пробрасывается.
 */
export async function saveDogWithPhotos<P>({
  api,
  currentDogId,
  payload,
  newFiles,
}: {
  api: SaveDogApi<P>;
  currentDogId?: string;
  payload: P;
  newFiles: File[];
}): Promise<{ dog: SavedDog; photoError: unknown }> {
  const dog = currentDogId
    ? await api.updateDog(currentDogId, payload)
    : await api.createDog(payload);

  if (!newFiles.length) return { dog, photoError: null };

  try {
    const uploaded = await Promise.all(newFiles.map((file) => api.uploadFile(file)));
    // Первое фото — аватар, только если у собаки его ещё нет.
    const hasAvatar = !!dog.avatar_file_id;
    await api.addDogImages(
      dog.id,
      uploaded.map((f, i) => ({ file_id: f.id, position: i, is_primary: !hasAvatar && i === 0 }))
    );
    return { dog, photoError: null };
  } catch (photoError) {
    return { dog, photoError };
  }
}
