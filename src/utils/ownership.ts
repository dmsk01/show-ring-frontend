// ----------------------------------------------------------------------
// Права на запись — по владению, как на бэкенде, а не по роли: право
// `kennels`/`litters`/`dogs` есть у любого заводчика, а бэкенд пускает
// только владельца питомника и admin (app/services/kennel.py, litter.py).
// Ревью фронтенда 2026-10-09, FE-33.

type Can = (permission: string) => boolean;

/** id питомников пользователя. */
export function myKennelIds(
  kennels: readonly { id: string; owner_id?: string | null }[],
  userId: string | null | undefined
): Set<string> {
  if (!userId) return new Set();
  return new Set(kennels.filter((k) => k.owner_id === userId).map((k) => k.id));
}

/** Изменить/удалить питомник: владелец или admin. */
export function canManageKennel(
  kennel: { owner_id: string },
  userId: string | null | undefined,
  can: Can
): boolean {
  if (!userId) return false;
  return can('*') || kennel.owner_id === userId;
}

/** Изменить помёт: владелец его питомника или admin. */
export function canManageLitter(
  litter: { kennel_id: string },
  userId: string | null | undefined,
  can: Can,
  ownKennelIds: ReadonlySet<string>
): boolean {
  if (!userId) return false;
  return can('*') || ownKennelIds.has(litter.kennel_id);
}
