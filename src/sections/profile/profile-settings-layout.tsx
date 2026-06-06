'use client';

import type { DashboardContentProps } from 'src/layouts/dashboard';

import { removeLastSlash } from 'minimal-shared/utils';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function ProfileSettingsLayout({ children, ...other }: DashboardContentProps) {
  const { t } = useTranslate(['profile', 'common']);
  const pathname = usePathname();

  const NAV_ITEMS = [
    {
      label: t('profile:tabs.profile'),
      icon: <Iconify width={24} icon="solar:user-id-bold" />,
      href: paths.dashboard.profile,
    },
    {
      label: t('profile:tabs.security'),
      icon: <Iconify width={24} icon="ic:round-vpn-key" />,
      href: `${paths.dashboard.profile}/security`,
    },
    {
      label: t('profile:tabs.socials'),
      icon: <Iconify width={24} icon="solar:share-bold" />,
      href: `${paths.dashboard.profile}/socials`,
    },
  ];

  return (
    <DashboardContent {...other}>
      <CustomBreadcrumbs
        heading={t('profile:breadcrumb.heading')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('profile:breadcrumb.current') },
        ]}
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
