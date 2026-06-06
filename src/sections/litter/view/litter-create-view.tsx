'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LitterCreateEditForm } from '../litter-create-edit-form';

// ----------------------------------------------------------------------

export function LitterCreateView() {
  const { t } = useTranslate(['litter', 'common']);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('form.headingNew')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.litters.root },
          { name: t('form.breadcrumb.new') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <LitterCreateEditForm />
    </DashboardContent>
  );
}
