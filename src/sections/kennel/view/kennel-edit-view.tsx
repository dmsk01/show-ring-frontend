'use client';

import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { updateKennel, useGetKennel } from 'src/actions/kennel';

import { toast } from 'src/components/snackbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { FileAvatarUploader } from 'src/components/file-upload/file-avatar-uploader';

import { KennelCreateEditForm } from '../kennel-create-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function KennelEditView({ id }: Props) {
  const { t } = useTranslate(['kennel', 'common']);

  const { kennel, kennelLoading } = useGetKennel(id);

  if (kennelLoading) return <LoadingScreen />;
  if (!kennel) return <DashboardContent>{t('detail.notFound')}</DashboardContent>;

  const handleAvatar = async (fileId: string) => {
    try {
      await updateKennel(id, { avatar_file_id: fileId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.avatarFailed'));
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('form.headingEdit')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.kennels.root },
          { name: kennel.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          {t('form.image')}
        </Typography>
        <FileAvatarUploader fileId={kennel.avatar_file_id} onUploaded={handleAvatar} />
      </Card>

      <KennelCreateEditForm currentKennel={kennel} />
    </DashboardContent>
  );
}
