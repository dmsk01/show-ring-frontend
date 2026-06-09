'use client';

import type { GroupBy } from '../show-results-utils';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';
import { useGetShow } from 'src/actions/show';
import { useShowResultRows } from 'src/actions/show-result';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks';

import { ShowResultsTable } from '../show-results-table';
import { SHOW_STATUS_COLOR, showStatusI18nKey, canRegisterForShow } from '../show-utils';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ShowPublicDetailView({ id }: Props) {
  const { t } = useTranslate(['show', 'common']);
  const router = useRouter();
  const { authenticated } = useAuthContext();
  const { show, showLoading } = useGetShow(id);

  const isCompleted = show?.status === 'completed';
  const [groupBy, setGroupBy] = useState<GroupBy>('class');
  const { rows, loading: rowsLoading } = useShowResultRows(isCompleted ? id : undefined);

  if (showLoading) return <LoadingScreen />;
  if (!show) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>{t('detail.notFound')}</Typography>
      </Container>
    );
  }

  const overview = [
    {
      label: t('detail.overview.dates'),
      value: show.date_end
        ? `${fDate(show.date_start)} – ${fDate(show.date_end)}`
        : fDate(show.date_start),
    },
    { label: t('detail.overview.city'), value: [show.city, show.country].filter(Boolean).join(', ') || '—' },
    { label: t('detail.overview.venue'), value: show.venue ?? '—' },
    { label: t('detail.overview.entryFee'), value: show.entry_fee != null ? fCurrency(show.entry_fee) : '—' },
    {
      label: t('detail.overview.registrationDeadline'),
      value: show.registration_deadline ? fDate(show.registration_deadline) : '—',
    },
  ];

  const canRegister = canRegisterForShow(show.status, show.registration_deadline);

  const handleRegister = () => {
    const target = paths.showcase.showRegister(id);
    if (authenticated) {
      router.push(target);
    } else {
      const query = new URLSearchParams({ returnTo: target }).toString();
      router.push(`${paths.auth.jwt.signIn}?${query}`);
    }
  };

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mb: 3, alignItems: { sm: 'center' } }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {show.name}
        </Typography>
        <Label color={SHOW_STATUS_COLOR[show.status] ?? 'default'}>
          {t(showStatusI18nKey(show.status))}
        </Label>
        <Tooltip title={canRegister ? '' : t('register.unavailable')} arrow>
          <span>
            <Button
              variant="contained"
              color="primary"
              disabled={!canRegister}
              onClick={handleRegister}
              startIcon={<Iconify icon="solar:user-plus-bold" />}
            >
              {t('register.cta')}
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Card sx={{ p: 3, mb: 5 }}>
        <Box
          sx={{
            gap: 3,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          {overview.map((item) => (
            <ListItemText
              key={item.label}
              primary={item.label}
              secondary={item.value}
              slotProps={{
                primary: { sx: { typography: 'body2', color: 'text.secondary' } },
                secondary: { sx: { mt: 0.5, typography: 'subtitle2', color: 'text.primary' } },
              }}
            />
          ))}
        </Box>

        {show.description && (
          <>
            <Divider sx={{ borderStyle: 'dashed', my: 3 }} />
            <Typography variant="body2">{show.description}</Typography>
          </>
        )}
      </Card>

      {isCompleted && (
        <>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {t('detail.results')}
          </Typography>
          <ShowResultsTable
            rows={rows}
            loading={rowsLoading}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
          />
        </>
      )}
    </Container>
  );
}
