'use client';

import { paths } from 'src/routes/paths';

import { useGetDog } from 'src/actions/dog';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DogCreateEditForm } from '../dog-create-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function DogEditView({ id }: Props) {
  const { dog, dogLoading } = useGetDog(id);

  if (dogLoading) return <LoadingScreen />;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit dog"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Dogs', href: paths.dashboard.dogs.root },
          { name: dog?.name ?? 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <DogCreateEditForm currentDog={dog} />
    </DashboardContent>
  );
}
