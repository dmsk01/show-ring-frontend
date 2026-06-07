import type { TFunction } from 'i18next';
import type { NavMainProps } from './main/nav/types';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/** Пункты главной (showcase) навигации. `t` — namespace `navbar`. */
export function navData(t: TFunction): NavMainProps['data'] {
  return [
    {
      title: t('main.home'),
      path: '/',
      icon: <Iconify width={22} icon="solar:home-angle-bold-duotone" />,
    },
    {
      title: t('main.kennels'),
      path: paths.showcase.kennels,
      icon: <Iconify width={22} icon="solar:home-2-bold-duotone" />,
    },
    {
      title: t('main.animals'),
      path: paths.showcase.animals,
      icon: <Iconify width={22} icon="solar:bone-bold-duotone" />,
    },
    {
      title: t('main.shows'),
      path: paths.showcase.shows,
      icon: <Iconify width={22} icon="solar:cup-star-bold-duotone" />,
    },
  ];
}
