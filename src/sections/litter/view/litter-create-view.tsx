'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LitterCreateEditForm } from '../litter-create-edit-form';

// ----------------------------------------------------------------------

export function LitterCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new litter"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Litters', href: paths.dashboard.litters.root },
          { name: 'New' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <LitterCreateEditForm />
    </DashboardContent>
  );
}
