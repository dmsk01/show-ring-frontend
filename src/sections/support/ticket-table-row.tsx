import type { LabelColor } from 'src/components/label';
import type { ITicket, TicketStatus, TicketPriority } from 'src/types/support';

import Link from '@mui/material/Link';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<TicketStatus, LabelColor> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'default',
};

const PRIORITY_COLOR: Record<TicketPriority, LabelColor> = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'error',
};

type Props = {
  row: ITicket;
  detailsHref: string;
};

export function TicketTableRow({ row, detailsHref }: Props) {
  return (
    <TableRow hover>
      <TableCell>
        <Link component={RouterLink} href={detailsHref} color="inherit" sx={{ fontWeight: 600 }}>
          {row.subject}
        </Link>
      </TableCell>

      <TableCell>
        <Label color={STATUS_COLOR[row.status]}>{row.status.replace('_', ' ')}</Label>
      </TableCell>
      <TableCell>
        <Label color={PRIORITY_COLOR[row.priority]}>{row.priority}</Label>
      </TableCell>
      <TableCell>{row.created_at?.slice(0, 10)}</TableCell>
    </TableRow>
  );
}
