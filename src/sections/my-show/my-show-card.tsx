'use client';

import type { CardProps } from '@mui/material/Card';
import type { IMyShowItem } from 'src/types/show';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CardLink, cardActionableSx } from 'src/components/card-link';

import { SHOW_STATUS_COLOR, showStatusI18nKey } from 'src/sections/show/show-utils';

// ----------------------------------------------------------------------

type Props = CardProps & { show: IMyShowItem };

export function MyShowCard({ show, sx, ...other }: Props) {
  const { t } = useTranslate('show');
  const detailsHref = paths.dashboard.myShows.details(show.id);
  const dates = show.date_end
    ? `${fDate(show.date_start)} – ${fDate(show.date_end)}`
    : fDate(show.date_start);
  const location = [show.city, show.country].filter(Boolean).join(', ') || '—';

  return (
    <Card sx={[cardActionableSx, { p: 3 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
        <CardLink href={detailsHref} variant="subtitle1">
          {show.name}
        </CardLink>
        <Label color={SHOW_STATUS_COLOR[show.status] ?? 'default'}>
          {t(showStatusI18nKey(show.status))}
        </Label>
      </Stack>

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', typography: 'body2' }}>
          <Iconify icon="solar:calendar-date-bold" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {dates}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', typography: 'body2' }}>
          <Iconify icon="mingcute:location-fill" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {location}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', typography: 'body2' }}>
          <Iconify icon="solar:users-group-rounded-bold" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('myShows.card.entriesCount', { count: show.my_entries_count })}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}
