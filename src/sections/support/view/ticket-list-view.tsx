'use client';

import type { TableHeadCellProps } from 'src/components/table';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetTickets } from 'src/actions/support';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableHeadCustom } from 'src/components/table';

import { TicketTableRow } from '../ticket-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'subject', label: 'Subject' },
  { id: 'status', label: 'Status', width: 140 },
  { id: 'priority', label: 'Priority', width: 120 },
  { id: 'created', label: 'Created', width: 140 },
];

export function TicketListView() {
  const table = useTable();
  const { tickets, ticketsLoading, ticketsEmpty } = useGetTickets();

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Support"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Support' }]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.support.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New ticket
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
              <TableHeadCustom headCells={TABLE_HEAD} rowCount={tickets.length} />

              <TableBody>
                {tickets.map((row) => (
                  <TicketTableRow
                    key={row.id}
                    row={row}
                    detailsHref={paths.dashboard.support.details(row.id)}
                  />
                ))}

                <TableNoData notFound={!ticketsLoading && ticketsEmpty} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>
      </Card>
    </DashboardContent>
  );
}
