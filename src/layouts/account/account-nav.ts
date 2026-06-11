import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

type ProfileLike =
  | { first_name?: string | null; last_name?: string | null; [key: string]: unknown }
  | null
  | undefined;
type UserLike = { email?: string | null } | null | undefined;

export type UserDisplay = { displayName: string; initial: string; email: string };

/** Имя для шапки/аватара: "Имя Фамилия" из профиля, иначе email; инициал — первая буква. */
export function getUserDisplay(user: UserLike, profile: ProfileLike): UserDisplay {
  const email = user?.email ?? '';
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
  const displayName = name || email;
  const initial = (displayName.charAt(0) || '?').toUpperCase();
  return { displayName, initial, email };
}

// ----------------------------------------------------------------------

export type MyObjectKey = 'kennels' | 'dogs' | 'litters';
export type MyObjectLink = { key: MyObjectKey; href: string };

// «Мои объекты»: kennels/litters — только владельцам (полное право на ресурс);
// dogs — каждой роли (dogs:create есть у всех, владение — по Dog.owner_id),
// и ведёт в личный раздел «Мои собаки», а не в общий список.
const MY_OBJECTS: { key: MyObjectKey; href: string; perm: string }[] = [
  { key: 'kennels', href: paths.dashboard.kennels.root, perm: 'kennels' },
  { key: 'dogs', href: paths.dashboard.myDogs.root, perm: 'dogs:create' },
  { key: 'litters', href: paths.dashboard.litters.root, perm: 'litters' },
];

/** Ссылки «Мои объекты», отфильтрованные по правам (cascade: `kennels` покрывает `kennels:view`, но не наоборот). Подпись резолвится по `key` на стороне UI (i18n). */
export function getMyObjectLinks(can: (perm: string) => boolean): MyObjectLink[] {
  return MY_OBJECTS.filter((i) => can(i.perm)).map(({ key, href }) => ({ key, href }));
}
