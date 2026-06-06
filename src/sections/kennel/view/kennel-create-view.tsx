'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { KennelCreateEditForm } from '../kennel-create-edit-form';

// ----------------------------------------------------------------------

export function KennelCreateView() {
  const { t } = useTranslate(['kennel', 'common']);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('form.headingNew')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.kennels.root },
          { name: t('form.headingNew') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <KennelCreateEditForm />
    </DashboardContent>
  );
}
