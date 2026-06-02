'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CampaignCreateEditForm } from '../campaign-create-edit-form';

// ----------------------------------------------------------------------

export function CampaignCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new campaign"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Ads', href: paths.dashboard.ads.root },
          { name: 'New' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CampaignCreateEditForm />
    </DashboardContent>
  );
}
