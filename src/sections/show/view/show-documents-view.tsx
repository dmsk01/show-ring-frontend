'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetShow } from 'src/actions/show';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ShowDocumentsPanel } from '../show-documents-panel';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ShowDocumentsView({ id }: Props) {
  const { t } = useTranslate(['show', 'common']);
  const { show } = useGetShow(id);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={show ? t('documents.heading', { name: show.name }) : t('documents.headingFallback')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.showcase.shows },
          { name: t('documents.headingFallback') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ShowDocumentsPanel showId={id} />
    </DashboardContent>
  );
}
