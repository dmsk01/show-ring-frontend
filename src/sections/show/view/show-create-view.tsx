'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ShowCreateEditForm } from '../show-create-edit-form';

// ----------------------------------------------------------------------

export function ShowCreateView() {
  const { t } = useTranslate(['show', 'common']);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('form.headingNew')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.shows.root },
          { name: t('form.headingNew') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <ShowCreateEditForm />
    </DashboardContent>
  );
}
