'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ClassifiedCreateEditForm } from '../classified-create-edit-form';

// ----------------------------------------------------------------------

export function ClassifiedCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new classified"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Classifieds', href: paths.dashboard.classifieds.root },
          { name: 'New' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <ClassifiedCreateEditForm />
    </DashboardContent>
  );
}
