'use client';

import { paths } from 'src/routes/paths';

import { usePermissions } from 'src/hooks/use-permissions';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetClassified } from 'src/actions/classified';

import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { canManageClassified } from '../classified-utils';
import { ClassifiedCreateEditForm } from '../classified-create-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ClassifiedEditView({ id }: Props) {
  const { t } = useTranslate(['classified', 'common']);
  const { classified, classifiedLoading } = useGetClassified(id);
  const { user, loading: authLoading } = useAuthContext();
  const { roles } = usePermissions();

  // Don't decide "no access" until both the listing and the session are loaded.
  if (classifiedLoading || authLoading) return <LoadingScreen />;
  if (!classified) return <DashboardContent>{t('form.notFound')}</DashboardContent>;

  // Ownership gate (mirrors backend author-or-admin). The route's
  // `classifieds:edit` PermissionGuard passes any breeder, so without this a
  // non-owner would see an editable form prefilled with someone else's data.
  if (!canManageClassified(classified, user?.id, roles.includes('admin'))) {
    return (
      <DashboardContent>
        <EmptyContent filled title={t('detail.noAccess')} sx={{ py: 10 }} />
      </DashboardContent>
    );
  }

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
