import type { NavMainProps } from './main/nav/types';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const navData: NavMainProps['data'] = [
  { title: 'Главная', path: '/', icon: <Iconify width={22} icon="solar:home-angle-bold-duotone" /> },
  {
    title: 'Питомники',
    path: paths.showcase.kennels,
    icon: <Iconify width={22} icon="solar:home-2-bold-duotone" />,
  },
  {
    title: 'Животные',
    path: paths.showcase.animals,
    icon: <Iconify width={22} icon="solar:bone-bold-duotone" />,
  },
  {
    title: 'Выставки',
    path: paths.showcase.shows,
    icon: <Iconify width={22} icon="solar:cup-star-bold-duotone" />,
  },
];
