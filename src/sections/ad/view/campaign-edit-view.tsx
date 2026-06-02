'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetCampaigns, useGetCampaignStats } from 'src/actions/ad';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CampaignBannerForm } from '../campaign-banner-form';
import { CampaignCreateEditForm } from '../campaign-create-edit-form';

// ----------------------------------------------------------------------

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <Stack sx={{ flex: 1, textAlign: 'center' }}>
      <Typography variant="h4">{value}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
    </Stack>
  );
}

type Props = { id: string };

export function CampaignEditView({ id }: Props) {
  const { campaigns, campaignsLoading } = useGetCampaigns();
  const { stats } = useGetCampaignStats(id);

  if (campaignsLoading) return <LoadingScreen />;

  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) return <DashboardContent>Campaign not found.</DashboardContent>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit campaign"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Ads', href: paths.dashboard.ads.root },
          { name: campaign.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {stats && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
            spacing={2}
          >
            <StatBox label="Impressions" value={stats.impressions} />
            <StatBox label="Clicks" value={stats.clicks} />
            <StatBox label="CTR" value={`${(stats.ctr * 100).toFixed(1)}%`} />
            <StatBox label="Spent" value={stats.spent} />
            <StatBox label="Remaining" value={stats.remaining_budget} />
          </Stack>
        </Card>
      )}

      <Box sx={{ mb: 3 }}>
        <CampaignCreateEditForm currentCampaign={campaign} />
      </Box>

      <CampaignBannerForm campaignId={id} />
    </DashboardContent>
  );
}
