'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DogCreateEditForm } from '../dog-create-edit-form';

// ----------------------------------------------------------------------

export function DogCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new dog"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Dogs', href: paths.dashboard.dogs.root },
          { name: 'New' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <DogCreateEditForm />
    </DashboardContent>
  );
}
