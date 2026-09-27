'use client';

import type { LabelColor } from 'src/components/label';
import type { ICampaign, CampaignStatus } from 'src/types/ad';

import Link from '@mui/material/Link';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { STATUS_TONE } from 'src/theme/semantic';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<CampaignStatus, LabelColor> = {
  draft: STATUS_TONE.neutral,
  active: STATUS_TONE.active,
  paused: STATUS_TONE.pending,
  completed: STATUS_TONE.neutral,
  cancelled: STATUS_TONE.danger,
};

type Props = {
  row: ICampaign;
  editHref: string;
};

export function CampaignTableRow({ row, editHref }: Props) {
  const { t } = useTranslate('ad');

  return (
    <TableRow hover>
      <TableCell>
        <Link
          component={RouterLink}
          href={editHref}
          color="inherit"
          sx={{ fontWeight: 'fontWeightSemiBold' }}
        >
          {row.name}
        </Link>
      </TableCell>

      <TableCell>
        <Label color={STATUS_COLOR[row.status]}>{t(`enums.status.${row.status}`)}</Label>
      </TableCell>

      <TableCell>{row.budget}</TableCell>
      <TableCell>{row.spent}</TableCell>
      <TableCell>
        {row.date_start?.slice(0, 10)} — {row.date_end?.slice(0, 10)}
      </TableCell>
    </TableRow>
  );
}
