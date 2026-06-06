'use client';

import type { LabelColor } from 'src/components/label';
import type { IShowItem, ShowStatus } from 'src/types/show';

import Link from '@mui/material/Link';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';

import { showStatusI18nKey } from './show-utils';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<ShowStatus, LabelColor> = {
  draft: 'default',
  registration_open: 'success',
  registration_closed: 'warning',
  in_progress: 'info',
  completed: 'default',
  cancelled: 'error',
};

type Props = {
  row: IShowItem;
  rankName?: string;
  editHref: string;
};

export function ShowTableRow({ row, rankName, editHref }: Props) {
  const { t } = useTranslate('show');

  return (
    <TableRow hover>
      <TableCell>
        <Link component={RouterLink} href={editHref} color="inherit" sx={{ fontWeight: 600 }}>
          {row.name}
        </Link>
      </TableCell>

      <TableCell>{rankName ?? '—'}</TableCell>
      <TableCell>{row.date_start?.slice(0, 10) ?? '—'}</TableCell>
      <TableCell>{row.city ?? '—'}</TableCell>
      <TableCell>
        <Label color={STATUS_COLOR[row.status]}>{t(showStatusI18nKey(row.status))}</Label>
      </TableCell>
    </TableRow>
  );
}
