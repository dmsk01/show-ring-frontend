'use client';

import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useUploadQuotas } from 'src/actions/upload-quota';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { FeatureFlagsPanel } from '../feature-flags-panel';
import { UploadQuotasPanel } from '../upload-quotas-panel';

// ----------------------------------------------------------------------

export function AdminSystemView() {
  const { t } = useTranslate(['admin', 'common']);
  const { quotas, quotasLoading } = useUploadQuotas();

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('system.title')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('breadcrumb.admin') },
          { name: t('system.breadcrumb') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <UploadQuotasPanel quotas={quotas} loading={quotasLoading} />
        <FeatureFlagsPanel />
      </Stack>
    </DashboardContent>
  );
}
