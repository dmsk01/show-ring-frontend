'use client';

import type { ShowStatus } from 'src/types/show';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetShow, publishShow, setShowStatus } from 'src/actions/show';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SHOW_STATUSES } from 'src/types/show';

import { showStatusI18nKey } from '../show-utils';
import { ShowCreateEditForm } from '../show-create-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ShowEditView({ id }: Props) {
  const { t } = useTranslate(['show', 'common']);
  const { show, showLoading } = useGetShow(id);

  if (showLoading) return <LoadingScreen />;
  if (!show) return <DashboardContent>{t('detail.notFound')}</DashboardContent>;

  const handleStatus = async (status: ShowStatus) => {
    try {
      await setShowStatus(id, status);
      toast.success(t('toast.statusUpdated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.statusFailed'));
    }
  };

  const handlePublish = async () => {
    try {
      await publishShow(id);
      toast.success(t('toast.published'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.publishFailed'));
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('form.headingEdit')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.shows.root },
          { name: show.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ gap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="subtitle2">{t('form.statusPanel')}</Typography>

          <TextField
            select
            size="small"
            label={t('form.fields.status')}
            value={show.status}
            onChange={(e) => handleStatus(e.target.value as ShowStatus)}
            sx={{ width: 220, ml: { sm: 'auto' } }}
          >
            {SHOW_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {t(showStatusI18nKey(s))}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:cup-star-bold" />}
            onClick={handlePublish}
          >
            {t('form.actions.publish')}
          </Button>

          <Button
            component={RouterLink}
            href={paths.dashboard.shows.results(id)}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:bill-list-bold" />}
          >
            {t('form.actions.results')}
          </Button>

          <Button
            component={RouterLink}
            href={paths.dashboard.shows.documents(id)}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:file-text-bold" />}
          >
            {t('form.actions.documents')}
          </Button>
        </Box>
      </Card>

      <ShowCreateEditForm currentShow={show} />
    </DashboardContent>
  );
}
