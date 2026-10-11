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
 * Может ли пользователь управлять собакой (edit/delete/фото). Зеркало
 * бэкендовского `can_manage_dog` (app/services/dog.py): владелец собаки,
 * владелец её питомника или admin. Право `dogs:edit` есть у любого
 * заводчика и доступа к чужим собакам НЕ даёт (ревью 2026-10-09, FE-33).
 */
export function canManageDog(
  dog: Pick<IDogItem, 'owner_id'> & { kennel_id?: string | null },
  userId: string | null | undefined,
  can: (perm: string) => boolean,
  ownKennelIds: ReadonlySet<string> = new Set()
): boolean {
  if (!userId) return false;
  if (can('*') || dog.owner_id === userId) return true;
  return !!dog.kennel_id && ownKennelIds.has(dog.kennel_id);
}
