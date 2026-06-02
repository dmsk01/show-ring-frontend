'use client';

import type { IShowFilters } from 'src/types/show';
import type { TableHeadCellProps } from 'src/components/table';

import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetShows } from 'src/actions/show';
import { DashboardContent } from 'src/layouts/dashboard';
import { useReferenceList } from 'src/actions/admin-reference';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { ShowTableRow } from '../show-table-row';
import { ShowTableToolbar } from '../show-table-toolbar';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'name', label: 'Name' },
  { id: 'rank', label: 'Rank', width: 160 },
  { id: 'date_start', label: 'Start', width: 140 },
  { id: 'city', label: 'City', width: 160 },
  { id: 'status', label: 'Status', width: 160 },
];

export function ShowListView() {
  const table = useTable({ defaultRowsPerPage: 25 });

  const filters = useSetState<IShowFilters>({ status: 'all', city: '' });
  const { state: currentFilters } = filters;

  const { items: ranks } = useReferenceList('/references/show-ranks');

  const { shows, showsTotal, showsLoading, showsEmpty } = useGetShows({
    page: table.page + 1,
    per_page: table.rowsPerPage,
    status: currentFilters.status,
    city: currentFilters.city || undefined,
  });

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Shows"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Shows' }]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.shows.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Add show
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <ShowTableToolbar filters={filters} onResetPage={table.onResetPage} />

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom headCells={TABLE_HEAD} rowCount={shows.length} />

              <TableBody>
                {shows.map((row) => (
                  <ShowTableRow
                    key={row.id}
                    row={row}
                    rankName={ranks.find((rank) => rank.id === row.rank_id)?.name}
                    editHref={paths.dashboard.shows.edit(row.id)}
                  />
                ))}

                <TableNoData notFound={!showsLoading && showsEmpty} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={showsTotal}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
