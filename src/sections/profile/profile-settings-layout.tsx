'use client';

import type { DashboardContentProps } from 'src/layouts/dashboard';

import { removeLastSlash } from 'minimal-shared/utils';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'Профиль', icon: <Iconify width={24} icon="solar:user-id-bold" />, href: paths.dashboard.profile },
  { label: 'Безопасность', icon: <Iconify width={24} icon="ic:round-vpn-key" />, href: `${paths.dashboard.profile}/security` },
  { label: 'Уведомления', icon: <Iconify width={24} icon="solar:bell-bing-bold" />, href: `${paths.dashboard.profile}/notifications` },
  { label: 'Соцсети', icon: <Iconify width={24} icon="solar:share-bold" />, href: `${paths.dashboard.profile}/socials` },
  { label: 'Обратная связь', icon: <Iconify width={24} icon="solar:chat-round-dots-bold" />, href: `${paths.dashboard.profile}/feedback` },
];

// ----------------------------------------------------------------------

export function ProfileSettingsLayout({ children, ...other }: DashboardContentProps) {
  const pathname = usePathname();

  return (
    <DashboardContent {...other}>
      <CustomBreadcrumbs
        heading="Личный кабинет"
        links={[{ name: 'Дашборд', href: paths.dashboard.root }, { name: 'Профиль' }]}
        sx={{ mb: 3 }}
      />

      <Tabs value={removeLastSlash(pathname)} sx={{ mb: { xs: 3, md: 5 } }}>
        {NAV_ITEMS.map((tab) => (
          <Tab
            component={RouterLink}
            key={tab.href}
            label={tab.label}
            icon={tab.icon}
            value={tab.href}
            href={tab.href}
          />
        ))}
      </Tabs>

      {children}
    </DashboardContent>
  );
}
