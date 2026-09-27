'use client';

import type { LabelColor } from 'src/components/label';
import type { ILitterItem, LitterStatus } from 'src/types/litter';

import Link from '@mui/material/Link';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { STATUS_TONE } from 'src/theme/semantic';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<LitterStatus, LabelColor> = {
  planned: STATUS_TONE.neutral,
  born: STATUS_TONE.progress,
  available: STATUS_TONE.active,
  sold_out: STATUS_TONE.neutral,
  archived: STATUS_TONE.neutral,
};

type Props = {
  row: ILitterItem;
  breedName?: string;
  kennelName?: string;
  editHref: string;
};

export function LitterTableRow({ row, breedName, kennelName, editHref }: Props) {
  const { t } = useTranslate('common');

  const price =
    row.price_from || row.price_to ? [row.price_from, row.price_to].filter(Boolean).join('–') : '—';

  return (
    <TableRow hover>
      <TableCell>
        <Link
          component={RouterLink}
          href={editHref}
          color="inherit"
          sx={{ fontWeight: 'fontWeightSemiBold' }}
        >
          {breedName ?? '—'}
        </Link>
      </TableCell>

      <TableCell>{kennelName ?? '—'}</TableCell>

      <TableCell>
        <Label color={STATUS_COLOR[row.status]}>{t(`enums.litterStatus.${row.status}`)}</Label>
      </TableCell>

      <TableCell>{row.born_at ?? '—'}</TableCell>
      <TableCell>{row.puppies_count ?? '—'}</TableCell>
      <TableCell>{price}</TableCell>
    </TableRow>
  );
}
