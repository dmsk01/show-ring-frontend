'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TicketCreateForm } from '../ticket-create-form';

// ----------------------------------------------------------------------

export function TicketCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="New support ticket"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Support', href: paths.dashboard.support.root },
          { name: 'New' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <TicketCreateForm />
    </DashboardContent>
  );
}
