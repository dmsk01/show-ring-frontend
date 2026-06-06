'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetClassified } from 'src/actions/classified';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ClassifiedCreateEditForm } from '../classified-create-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ClassifiedEditView({ id }: Props) {
  const { t } = useTranslate(['classified', 'common']);
  const { classified, classifiedLoading } = useGetClassified(id);

  if (classifiedLoading) return <LoadingScreen />;
  if (!classified) return <DashboardContent>{t('form.notFound')}</DashboardContent>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('form.headingEdit')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.classifieds.root },
          { name: classified.title },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <ClassifiedCreateEditForm currentClassified={classified} />
    </DashboardContent>
  );
}
