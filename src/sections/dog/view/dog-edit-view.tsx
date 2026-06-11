'use client';

import { paths } from 'src/routes/paths';

import { usePermissions } from 'src/hooks/use-permissions';

import { useTranslate } from 'src/locales';
import { useGetDog } from 'src/actions/dog';
import { DashboardContent } from 'src/layouts/dashboard';

import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { canManageDog } from '../dog-utils';
import { DogCreateEditForm } from '../dog-create-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function DogEditView({ id }: Props) {
  const { t } = useTranslate(['dog', 'common']);
  const { dog, dogLoading } = useGetDog(id);
  const { user, loading: authLoading } = useAuthContext();
  const { can } = usePermissions();

  // authLoading: не решаем «нет доступа», пока сессия не загружена (актуально
  // при CONFIG.auth.skip, когда AuthGuard не дожидается checkUserSession).
  if (dogLoading || authLoading) return <LoadingScreen />;

  // Avoid silently falling into "create" mode when the dog id is missing/deleted.
  if (!dog) return <DashboardContent>{t('detail.notFound')}</DashboardContent>;

  // Зеркало бэкендовских прав: владелец по owner_id ИЛИ dogs:edit (breeder/admin).
  if (!canManageDog(dog, user?.id, can)) {
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
          { name: t('list.title'), href: paths.dashboard.dogs.root },
          { name: dog?.name ?? t('form.headingEdit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <DogCreateEditForm currentDog={dog} />
    </DashboardContent>
  );
}
