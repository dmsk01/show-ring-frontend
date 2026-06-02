'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ShowCreateEditForm } from '../show-create-edit-form';

// ----------------------------------------------------------------------

export function ShowCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new show"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Shows', href: paths.dashboard.shows.root },
          { name: 'New' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <ShowCreateEditForm />
    </DashboardContent>
  );
}
