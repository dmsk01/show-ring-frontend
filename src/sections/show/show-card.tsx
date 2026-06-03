import type { CardProps } from '@mui/material/Card';
import type { IShowItem } from 'src/types/show';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_LABEL: Record<string, string> = {
  registration_open: 'Регистрация открыта',
  registration_closed: 'Регистрация закрыта',
  in_progress: 'Идёт',
  completed: 'Завершена',
};

type Props = CardProps & { show: IShowItem };

export function ShowCard({ show, sx, ...other }: Props) {
  const detailsHref = paths.showcase.show(show.id);
  const dates = show.date_end
    ? `${fDate(show.date_start)} – ${fDate(show.date_end)}`
    : fDate(show.date_start);

  const location = [show.city, show.country].filter(Boolean).join(', ') || '—';

  return (
    <Card sx={{ p: 3, ...sx }} {...other}>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Link component={RouterLink} href={detailsHref} color="inherit" variant="subtitle1">
          {show.name}
        </Link>
        <Label color={show.status === 'completed' ? 'default' : 'success'}>
          {STATUS_LABEL[show.status] ?? show.status}
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
          <Iconify icon="solar:cup-star-bold" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {show.venue ?? '—'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', typography: 'body2' }}>
          <Iconify icon="solar:wad-of-money-bold" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {show.entry_fee != null ? fCurrency(show.entry_fee) : '—'}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}
