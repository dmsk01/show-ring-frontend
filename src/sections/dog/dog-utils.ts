import type { DogSex, IDogItem } from 'src/types/dog';

import { CONFIG } from 'src/global-config';

// Dogs have no photos in the backend — use a deterministic placeholder cover by sex.
const DOG_PLACEHOLDERS: Record<DogSex, string> = {
  male: `${CONFIG.assetsDir}/assets/images/mock/cover/cover-12.webp`,
  female: `${CONFIG.assetsDir}/assets/images/mock/cover/cover-7.webp`,
};

export function dogPlaceholderImage(sex?: DogSex | null): string {
  if (sex && sex in DOG_PLACEHOLDERS) {
    return DOG_PLACEHOLDERS[sex];
  }
  return DOG_PLACEHOLDERS.male;
}

// ----------------------------------------------------------------------

/**
 * Может ли пользователь управлять собакой (edit/delete/фото).
 * Зеркало бэкендовского `_check_can_manage_dog` (app/services/dog.py)
 * с упрощением: ветку «владелец питомника» на фронте не проверяем — такой
 * пользователь это breeder, у него уже есть `dogs:edit` через право `dogs`.
 * Авторитет — бэкенд, он перепроверяет права независимо.
 * owner_id=null (легаси-собаки без владельца) — только по праву.
 */
export function canManageDog(
  dog: Pick<IDogItem, 'owner_id'>,
  userId: string | null | undefined,
  can: (perm: string) => boolean
): boolean {
  return can('dogs:edit') || (!!userId && dog.owner_id === userId);
}
