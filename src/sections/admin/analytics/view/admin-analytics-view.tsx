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

const KPIS: { key: keyof IDashboardStats; label: string; icon: string; color: string }[] = [
  { key: 'total_users', label: 'Users', icon: 'solar:user-rounded-bold', color: 'primary.main' },
  { key: 'total_kennels', label: 'Kennels', icon: 'solar:bill-list-bold', color: 'info.main' },
  { key: 'verified_kennels', label: 'Verified kennels', icon: 'solar:shield-check-bold', color: 'success.main' },
  { key: 'total_dogs', label: 'Dogs', icon: 'solar:heart-bold', color: 'error.main' },
  { key: 'total_litters', label: 'Litters', icon: 'solar:gallery-add-bold', color: 'warning.main' },
  { key: 'active_classifieds', label: 'Active classifieds', icon: 'solar:cart-plus-bold', color: 'secondary.main' },
  { key: 'open_shows', label: 'Open shows', icon: 'solar:clock-circle-bold', color: 'info.main' },
  { key: 'completed_shows', label: 'Completed shows', icon: 'solar:check-circle-bold', color: 'success.main' },
  { key: 'active_campaigns', label: 'Active campaigns', icon: 'solar:wad-of-money-bold', color: 'primary.main' },
];

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
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
        heading="Analytics"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Admin' },
          { name: 'Analytics' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {KPIS.map((kpi) => (
          <Grid key={kpi.key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <StatCard
              label={kpi.label}
              value={stats?.[kpi.key] != null ? Number(stats[kpi.key]) : 0}
              icon={kpi.icon}
              color={kpi.color}
            />
          </Grid>
        ))}

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader title="Ad performance" subheader="Impressions & clicks per day" />
            <Box sx={{ p: 3 }}>
              <Chart
                type="line"
                series={[
                  { name: 'Impressions', data: adsDaily.map((d) => d.impressions) },
                  { name: 'Clicks', data: adsDaily.map((d) => d.clicks) },
                ]}
                options={adsChartOptions}
                sx={{ height: 320 }}
              />
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: 1 }}>
            <CardHeader title="Top breeds" subheader="By entries" />
            <Scrollbar>
              <Table size="small" sx={{ minWidth: 280 }}>
                <TableHeadCustom
                  headCells={[
                    { id: 'breed', label: 'Breed' },
                    { id: 'entries', label: 'Entries', align: 'right' },
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
            <CardHeader title="Top campaigns" subheader="By spend" />
            <Box sx={{ p: 3 }}>
              <Stack spacing={2}>
                {topCampaigns.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    No campaign data.
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
