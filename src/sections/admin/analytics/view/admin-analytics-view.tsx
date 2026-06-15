'use client';

import type { IDashboardStats } from 'src/types/analytics';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  useAdsDaily,
  useTopBreeds,
  useTopCampaigns,
  useDashboardStats,
} from 'src/actions/analytics';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Chart, useChart } from 'src/components/chart';
import { TableHeadCustom } from 'src/components/table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const KPIS: {
  key: keyof IDashboardStats;
  icon: string;
  color: string;
  href: string;
}[] = [
  { key: 'total_users', icon: 'solar:user-rounded-bold', color: 'primary.main', href: paths.dashboard.adminUsers },
  { key: 'total_kennels', icon: 'solar:bill-list-bold', color: 'info.main', href: paths.dashboard.kennels.root },
  { key: 'verified_kennels', icon: 'solar:shield-check-bold', color: 'success.main', href: paths.dashboard.adminModeration },
  { key: 'total_dogs', icon: 'solar:heart-bold', color: 'error.main', href: paths.dashboard.dogs.root },
  { key: 'total_litters', icon: 'solar:gallery-add-bold', color: 'warning.main', href: paths.dashboard.litters.root },
  { key: 'active_classifieds', icon: 'solar:cart-plus-bold', color: 'secondary.main', href: paths.dashboard.classifieds.root },
  { key: 'open_shows', icon: 'solar:clock-circle-bold', color: 'info.main', href: paths.showcase.shows },
  { key: 'completed_shows', icon: 'solar:check-circle-bold', color: 'success.main', href: paths.showcase.shows },
  { key: 'active_campaigns', icon: 'solar:wad-of-money-bold', color: 'primary.main', href: paths.dashboard.ads.root },
];

function StatCard({
  label,
  value,
  icon,
  color,
  href,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  href: string;
}) {
  return (
    <Card
      component={RouterLink}
      href={href}
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        color: 'inherit',
        textDecoration: 'none',
        transition: (theme) =>
          theme.transitions.create(['box-shadow', 'transform'], {
            duration: theme.transitions.duration.shorter,
          }),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.customShadows.z16,
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          bgcolor: (theme) => `color-mix(in srgb, ${color} 12%, transparent)`,
        }}
      >
        <Iconify icon={icon as never} width={26} />
      </Box>
      <Box>
        <Typography variant="h4">{value}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
      </Box>
    </Card>
  );
}

export function AdminAnalyticsView() {
  const { t } = useTranslate(['admin', 'common']);

  const { stats } = useDashboardStats();
  const { topBreeds } = useTopBreeds();
  const { topCampaigns } = useTopCampaigns();
  const { adsDaily } = useAdsDaily();

  const adsChartOptions = useChart({
    xaxis: { categories: adsDaily.map((d) => d.day?.slice(5, 10)) },
  });

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('analytics.list.title')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('breadcrumb.admin') },
          { name: t('analytics.list.breadcrumb') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {KPIS.map((kpi) => (
          <Grid key={kpi.key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <StatCard
              label={t(`analytics.kpi.${kpi.key}`)}
              value={stats?.[kpi.key] != null ? Number(stats[kpi.key]) : 0}
              icon={kpi.icon}
              color={kpi.color}
              href={kpi.href}
            />
          </Grid>
        ))}

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader
              title={t('analytics.adPerformance.title')}
              subheader={t('analytics.adPerformance.subheader')}
            />
            <Box sx={{ p: 3 }}>
              <Chart
                type="line"
                series={[
                  { name: t('analytics.adPerformance.impressions'), data: adsDaily.map((d) => d.impressions) },
                  { name: t('analytics.adPerformance.clicks'), data: adsDaily.map((d) => d.clicks) },
                ]}
                options={adsChartOptions}
                sx={{ height: 320 }}
              />
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: 1 }}>
            <CardHeader
              title={t('analytics.topBreeds.title')}
              subheader={t('analytics.topBreeds.subheader')}
            />
            <Scrollbar>
              <Table size="small" sx={{ minWidth: 280 }}>
                <TableHeadCustom
                  headCells={[
                    { id: 'breed', label: t('analytics.topBreeds.columns.breed') },
                    { id: 'entries', label: t('analytics.topBreeds.columns.entries'), align: 'right' },
                  ]}
                />
                <TableBody>
                  {topBreeds.map((b) => (
                    <TableRow key={b.breed_id}>
                      <TableCell>{b.breed_name}</TableCell>
                      <TableCell align="right">{b.entries_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Scrollbar>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title={t('analytics.topCampaigns.title')}
              subheader={t('analytics.topCampaigns.subheader')}
            />
            <Box sx={{ p: 3 }}>
              <Stack spacing={2}>
                {topCampaigns.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    {t('analytics.topCampaigns.empty')}
                  </Typography>
                )}
                {topCampaigns.map((c) => (
                  <Box key={c.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="subtitle2">{c.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {c.spent} / {c.budget}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(Number(c.spent_percent ?? 0), 100)}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
