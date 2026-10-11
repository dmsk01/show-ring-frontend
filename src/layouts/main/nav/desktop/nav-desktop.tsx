import type { NavMainProps } from '../types';

import { useTranslate } from 'src/locales';

import { Nav, NavUl } from '../components';
import { NavList } from './nav-desktop-list';

// ----------------------------------------------------------------------

export function NavDesktop({ data, sx, ...other }: NavMainProps) {
  const { t } = useTranslate('common');

  return (
    <Nav
      aria-label={t('a11y.siteNav')}
      sx={[
        () => ({
          /* Put styles */
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <NavUl
        sx={{
          gap: 5,
          height: 1,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {data.map((list) => (
          <NavList key={list.title} data={list} />
        ))}
      </NavUl>
    </Nav>
  );
}
