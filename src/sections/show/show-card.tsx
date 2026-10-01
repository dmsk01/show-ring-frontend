'use client';

import type { CardProps } from '@mui/material/Card';
import type { IShowItem } from 'src/types/show';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { MetaRow } from 'src/components/meta-row';
import { CardLink, cardActionableSx } from 'src/components/card-link';

import { SHOW_STATUS_COLOR, showStatusI18nKey } from './show-utils';

// ----------------------------------------------------------------------

type Props = CardProps & { show: IShowItem };

export function ShowCard({ show, sx, ...other }: Props) {
  const { t } = useTranslate('show');
  const detailsHref = paths.showcase.show(show.id);
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
        <MetaRow icon="solar:calendar-date-bold">{dates}</MetaRow>

        <MetaRow icon="mingcute:location-fill">{location}</MetaRow>

        <MetaRow icon="mingcute:location-fill">{show.venue ?? '—'}</MetaRow>

        <MetaRow icon="solar:wad-of-money-bold">
          {show.entry_fee != null ? fCurrency(show.entry_fee) : '—'}
        </MetaRow>
      </Stack>
    </Card>
  );
}
