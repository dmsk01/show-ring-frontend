'use client';

import type { IShowItem } from 'src/types/show';

import Link from '@mui/material/Link';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';

import { SHOW_STATUS_COLOR, showStatusI18nKey } from './show-utils';

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
        <Label color={SHOW_STATUS_COLOR[row.status]}>{t(showStatusI18nKey(row.status))}</Label>
      </TableCell>
    </TableRow>
  );
}
