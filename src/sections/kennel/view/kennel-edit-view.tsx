'use client';

import { paths } from 'src/routes/paths';

import { useGetKennel } from 'src/actions/kennel';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { KennelCreateEditForm } from '../kennel-create-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function KennelEditView({ id }: Props) {
  const { kennel, kennelLoading } = useGetKennel(id);

  if (kennelLoading) return <LoadingScreen />;
  if (!kennel) return <DashboardContent>Kennel not found.</DashboardContent>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit kennel"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Kennels', href: paths.dashboard.kennels.root },
          { name: kennel.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <KennelCreateEditForm currentKennel={kennel} />
    </DashboardContent>
  );
}
