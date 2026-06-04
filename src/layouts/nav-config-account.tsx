import type { AccountDrawerProps } from './components/account-drawer';
import type { IconifyName } from 'src/components/iconify/register-icons';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { getMyObjectLinks } from './account/account-nav';

// ----------------------------------------------------------------------

type AccountNavData = NonNullable<AccountDrawerProps['data']>;

const OBJECT_ICON: Record<string, IconifyName> = {
  kennels: 'solar:home-2-bold-duotone',
  dogs: 'solar:notes-bold-duotone',
  litters: 'solar:users-group-rounded-bold-duotone',
};

/** Боевые пункты drawer: Дашборд + Настройки профиля + role-aware «Мои объекты». */
export function getAccountNavData(can: (perm: string) => boolean): AccountNavData {
  const base: AccountNavData = [
    {
      label: 'Дашборд',
      href: paths.dashboard.root,
      icon: <Iconify icon="solar:home-angle-bold-duotone" />,
    },
    {
      label: 'Настройки профиля',
      href: paths.dashboard.profile,
      icon: <Iconify icon="solar:settings-bold-duotone" />,
    },
  ];

  const myObjects: AccountNavData = getMyObjectLinks(can).map((link) => ({
    label: link.label,
    href: link.href,
    icon: <Iconify icon={OBJECT_ICON[link.key]} />,
  }));

  return [...base, ...myObjects];
}

