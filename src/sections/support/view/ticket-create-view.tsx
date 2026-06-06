'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TicketCreateForm } from '../ticket-create-form';

// ----------------------------------------------------------------------

export function TicketCreateView() {
  const { t } = useTranslate(['support', 'common']);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('form.headingNew')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.support.root },
          { name: t('form.headingNew') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <TicketCreateForm />
    </DashboardContent>
  );
}
