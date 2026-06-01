'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { KennelCreateEditForm } from '../kennel-create-edit-form';

// ----------------------------------------------------------------------

export function KennelCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new kennel"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Kennels', href: paths.dashboard.kennels.root },
          { name: 'New' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <KennelCreateEditForm />
    </DashboardContent>
  );
}
