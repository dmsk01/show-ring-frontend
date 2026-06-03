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
export type MyObjectLink = { key: MyObjectKey; label: string; href: string };

// Показываем только владельцам (полное право на ресурс), не view-only.
const MY_OBJECTS: { key: MyObjectKey; label: string; href: string; perm: string }[] = [
  { key: 'kennels', label: 'Мои питомники', href: paths.dashboard.kennels.root, perm: 'kennels' },
  { key: 'dogs', label: 'Мои собаки', href: paths.dashboard.dogs.root, perm: 'dogs' },
  { key: 'litters', label: 'Мои помёты', href: paths.dashboard.litters.root, perm: 'litters' },
];

/** Ссылки «Мои объекты», отфильтрованные по правам (cascade: `kennels` покрывает `kennels:view`, но не наоборот). */
export function getMyObjectLinks(can: (perm: string) => boolean): MyObjectLink[] {
  return MY_OBJECTS.filter((i) => can(i.perm)).map(({ key, label, href }) => ({ key, label, href }));
}
