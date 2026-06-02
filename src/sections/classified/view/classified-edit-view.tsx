'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetClassified } from 'src/actions/classified';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ClassifiedCreateEditForm } from '../classified-create-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ClassifiedEditView({ id }: Props) {
  const { classified, classifiedLoading } = useGetClassified(id);

  if (classifiedLoading) return <LoadingScreen />;
  if (!classified) return <DashboardContent>Classified not found.</DashboardContent>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit classified"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Classifieds', href: paths.dashboard.classifieds.root },
          { name: classified.title },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <ClassifiedCreateEditForm currentClassified={classified} />
    </DashboardContent>
  );
}
