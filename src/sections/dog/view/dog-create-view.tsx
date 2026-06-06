'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DogCreateEditForm } from '../dog-create-edit-form';

// ----------------------------------------------------------------------

export function DogCreateView() {
  const { t } = useTranslate(['dog', 'common']);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('form.headingNew')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.dogs.root },
          { name: t('form.headingNew') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <DogCreateEditForm />
    </DashboardContent>
  );
}
