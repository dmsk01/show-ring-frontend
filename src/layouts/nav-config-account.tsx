import type { TFunction } from 'i18next';
import type { MyObjectKey } from './account/account-nav';
import type { AccountDrawerProps } from './components/account-drawer';
import type { IconifyName } from 'src/components/iconify/register-icons';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { getMyObjectLinks } from './account/account-nav';

// ----------------------------------------------------------------------

type AccountNavData = NonNullable<AccountDrawerProps['data']>;

const OBJECT_ICON: Record<MyObjectKey, IconifyName> = {
  kennels: 'solar:home-2-bold-duotone',
  dogs: 'solar:notes-bold-duotone',
  litters: 'solar:users-group-rounded-bold-duotone',
};

const OBJECT_LABEL_KEY: Record<MyObjectKey, string> = {
  kennels: 'drawer.myKennels',
  dogs: 'drawer.myDogs',
  litters: 'drawer.myLitters',
};

/** Боевые пункты drawer: Дашборд + Настройки профиля + role-aware «Мои объекты». `t` — namespace `account`. */
export function getAccountNavData(t: TFunction, can: (perm: string) => boolean): AccountNavData {
  const base: AccountNavData = [
    {
      label: t('drawer.dashboard'),
      href: paths.dashboard.root,
      icon: <Iconify icon="solar:home-angle-bold-duotone" />,
    },
    {
      label: t('drawer.profileSettings'),
      href: paths.dashboard.profile,
      icon: <Iconify icon="solar:settings-bold-duotone" />,
    },
  ];

  const myObjects: AccountNavData = getMyObjectLinks(can).map((link) => ({
    label: t(OBJECT_LABEL_KEY[link.key]),
    href: link.href,
    icon: <Iconify icon={OBJECT_ICON[link.key]} />,
  }));

  const myShows: AccountNavData = can('dogs:view')
    ? [
        {
          label: t('drawer.myShows'),
          href: paths.dashboard.myShows.root,
          icon: <Iconify icon="solar:cup-star-bold-duotone" />,
        },
      ]
    : [];

  return [...base, ...myShows, ...myObjects];
}

