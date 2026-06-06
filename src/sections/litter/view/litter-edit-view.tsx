'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetLitter } from 'src/actions/litter';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LitterCreateEditForm } from '../litter-create-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function LitterEditView({ id }: Props) {
  const { t } = useTranslate(['litter', 'common']);
  const { litter, litterLoading } = useGetLitter(id);

  if (litterLoading) return <LoadingScreen />;
  if (!litter) return <DashboardContent>{t('detail.notFound')}</DashboardContent>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('form.headingEdit')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.litters.root },
          { name: t('form.breadcrumb.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <LitterCreateEditForm currentLitter={litter} />
    </DashboardContent>
  );
}
