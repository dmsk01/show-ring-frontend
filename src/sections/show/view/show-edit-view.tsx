'use client';

import type { ShowStatus } from 'src/types/show';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetShow, publishShow, setShowStatus } from 'src/actions/show';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SHOW_STATUSES } from 'src/types/show';

import { ShowCreateEditForm } from '../show-create-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ShowEditView({ id }: Props) {
  const { show, showLoading } = useGetShow(id);

  if (showLoading) return <LoadingScreen />;
  if (!show) return <DashboardContent>Show not found.</DashboardContent>;

  const handleStatus = async (status: ShowStatus) => {
    try {
      await setShowStatus(id, status);
      toast.success('Status updated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handlePublish = async () => {
    try {
      await publishShow(id);
      toast.success('Show published!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Publish failed');
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit show"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Shows', href: paths.dashboard.shows.root },
          { name: show.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ gap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="subtitle2">Status & publishing</Typography>

          <TextField
            select
            size="small"
            label="Status"
            value={show.status}
            onChange={(e) => handleStatus(e.target.value as ShowStatus)}
            sx={{ width: 220, ml: { sm: 'auto' } }}
          >
            {SHOW_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s.replace('_', ' ')}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:cup-star-bold" />}
            onClick={handlePublish}
          >
            Publish
          </Button>
        </Box>
      </Card>

      <ShowCreateEditForm currentShow={show} />
    </DashboardContent>
  );
}
