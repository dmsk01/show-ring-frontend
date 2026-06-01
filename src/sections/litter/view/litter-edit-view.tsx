'use client';

import { paths } from 'src/routes/paths';

import { useGetLitter } from 'src/actions/litter';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LitterCreateEditForm } from '../litter-create-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function LitterEditView({ id }: Props) {
  const { litter, litterLoading } = useGetLitter(id);

  if (litterLoading) return <LoadingScreen />;
  if (!litter) return <DashboardContent>Litter not found.</DashboardContent>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit litter"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Litters', href: paths.dashboard.litters.root },
          { name: 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <LitterCreateEditForm currentLitter={litter} />
    </DashboardContent>
  );
}
