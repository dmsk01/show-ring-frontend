'use client';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { useStaffShows } from 'src/actions/checkin';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SHOW_STATUS_COLOR, showStatusI18nKey } from 'src/sections/show/show-utils';

// ----------------------------------------------------------------------

/** Выставки, где текущий пользователь — регистратор стойки. */
export function StaffShowsView() {
  const { t } = useTranslate(['checkin', 'show', 'common']);
  const { shows, showsLoading } = useStaffShows();

  if (showsLoading) return <LoadingScreen />;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('staffShows.title')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('staffShows.title') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {shows.length === 0 ? (
        <EmptyContent filled title={t('staffShows.empty')} sx={{ py: 8 }} />
      ) : (
        <Card>
          <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
            {shows.map((show) => (
              <Stack
                key={show.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ sm: 'center' }}
                justifyContent="space-between"
                sx={{ p: 2.5 }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1">{show.name}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {fDate(show.date_start)}
                    {show.city ? ` · ${show.city}` : ''}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Label color={SHOW_STATUS_COLOR[show.status] ?? 'default'}>
                    {t(`show:${showStatusI18nKey(show.status)}`)}
                  </Label>
                  <Button
                    variant="contained"
                    component={RouterLink}
                    href={paths.dashboard.shows.checkin(show.id)}
                  >
                    {t('staffShows.open')}
                  </Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}
    </DashboardContent>
  );
}
