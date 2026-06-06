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

export function AccountLayout({ children, ...other }: DashboardContentProps) {
  const pathname = usePathname();
  const { t } = useTranslate('account');

  const NAV_ITEMS = [
    {
      label: t('tabs.general'),
      icon: <Iconify width={24} icon="solar:user-id-bold" />,
      href: paths.dashboard.user.account,
    },
    {
      label: t('tabs.billing'),
      icon: <Iconify width={24} icon="solar:bill-list-bold" />,
      href: `${paths.dashboard.user.account}/billing`,
    },
    {
      label: t('tabs.notifications'),
      icon: <Iconify width={24} icon="solar:bell-bing-bold" />,
      href: `${paths.dashboard.user.account}/notifications`,
    },
    {
      label: t('tabs.socialLinks'),
      icon: <Iconify width={24} icon="solar:share-bold" />,
      href: `${paths.dashboard.user.account}/socials`,
    },
    {
      label: t('tabs.security'),
      icon: <Iconify width={24} icon="ic:round-vpn-key" />,
      href: `${paths.dashboard.user.account}/change-password`,
    },
  ];

  return (
    <DashboardContent {...other}>
      <CustomBreadcrumbs
        heading={t('breadcrumb.heading')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('breadcrumb.user'), href: paths.dashboard.user.root },
          { name: t('breadcrumb.account') },
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
