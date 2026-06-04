'use client';

import type { GroupBy } from '../show-results-utils';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useGetShow } from 'src/actions/show';
import { useShowResultRows } from 'src/actions/show-result';

import { Label } from 'src/components/label';
import { LoadingScreen } from 'src/components/loading-screen';

import { ShowResultsTable } from '../show-results-table';
import { SHOW_STATUS_COLOR, SHOW_STATUS_LABEL } from '../show-utils';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ShowPublicDetailView({ id }: Props) {
  const { show, showLoading } = useGetShow(id);

  const isCompleted = show?.status === 'completed';
  const [groupBy, setGroupBy] = useState<GroupBy>('class');
  const { rows, loading: rowsLoading } = useShowResultRows(isCompleted ? id : undefined);

  if (showLoading) return <LoadingScreen />;
  if (!show) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>Выставка не найдена.</Typography>
      </Container>
    );
  }

  const overview = [
    {
      label: 'Даты',
      value: show.date_end
        ? `${fDate(show.date_start)} – ${fDate(show.date_end)}`
        : fDate(show.date_start),
    },
    { label: 'Город', value: [show.city, show.country].filter(Boolean).join(', ') || '—' },
    { label: 'Площадка', value: show.venue ?? '—' },
    { label: 'Взнос', value: show.entry_fee != null ? fCurrency(show.entry_fee) : '—' },
    {
      label: 'Дедлайн регистрации',
      value: show.registration_deadline ? fDate(show.registration_deadline) : '—',
    },
  ];

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {show.name}
        </Typography>
        <Label color={SHOW_STATUS_COLOR[show.status] ?? 'default'}>
          {SHOW_STATUS_LABEL[show.status] ?? show.status}
        </Label>
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
            Результаты
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
