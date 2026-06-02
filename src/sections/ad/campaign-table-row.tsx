import type { LabelColor } from 'src/components/label';
import type { ICampaign, CampaignStatus } from 'src/types/ad';

import Link from '@mui/material/Link';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<CampaignStatus, LabelColor> = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  completed: 'info',
  cancelled: 'error',
};

type Props = {
  row: ICampaign;
  editHref: string;
};

export function CampaignTableRow({ row, editHref }: Props) {
  return (
    <TableRow hover>
      <TableCell>
        <Link component={RouterLink} href={editHref} color="inherit" sx={{ fontWeight: 600 }}>
          {row.name}
        </Link>
      </TableCell>

      <TableCell>
        <Label color={STATUS_COLOR[row.status]}>{row.status}</Label>
      </TableCell>

      <TableCell>{row.budget}</TableCell>
      <TableCell>{row.spent}</TableCell>
      <TableCell>
        {row.date_start?.slice(0, 10)} — {row.date_end?.slice(0, 10)}
      </TableCell>
    </TableRow>
  );
}
