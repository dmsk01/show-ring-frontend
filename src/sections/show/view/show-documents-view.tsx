'use client';

import { paths } from 'src/routes/paths';

import { useGetShow } from 'src/actions/show';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ShowDocumentsPanel } from '../show-documents-panel';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ShowDocumentsView({ id }: Props) {
  const { show } = useGetShow(id);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={show ? `Документы — ${show.name}` : 'Документы'}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Выставки', href: paths.dashboard.shows.root },
          { name: 'Документы' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ShowDocumentsPanel showId={id} />
    </DashboardContent>
  );
}
