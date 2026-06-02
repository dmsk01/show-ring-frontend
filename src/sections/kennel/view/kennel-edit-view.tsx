'use client';

import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

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
  const { kennel, kennelLoading } = useGetKennel(id);

  if (kennelLoading) return <LoadingScreen />;
  if (!kennel) return <DashboardContent>Kennel not found.</DashboardContent>;

  const handleAvatar = async (fileId: string) => {
    try {
      await updateKennel(id, { avatar_file_id: fileId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update avatar');
    }
  };

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

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Kennel image
        </Typography>
        <FileAvatarUploader
          fileId={kennel.avatar_file_id}
          alt={kennel.name}
          onUploaded={handleAvatar}
        />
      </Card>

      <KennelCreateEditForm currentKennel={kennel} />
    </DashboardContent>
  );
}
