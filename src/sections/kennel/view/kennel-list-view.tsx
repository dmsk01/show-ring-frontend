'use client';

import type { IKennelTableFilters } from 'src/types/kennel';
import type { TableHeadCellProps } from 'src/components/table';

import { useCallback } from 'react';
import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import { deleteKennel, useGetKennelsList } from 'src/actions/kennel';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { KennelTableRow } from '../kennel-table-row';
import { KennelTableToolbar } from '../kennel-table-toolbar';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'name', label: 'Name' },
  { id: 'kennel_prefix', label: 'Prefix', width: 160 },
  { id: 'city', label: 'City', width: 160 },
  { id: 'country', label: 'Country', width: 140 },
  { id: 'contact_email', label: 'Email', width: 220 },
  { id: '', width: 88 },
];

export function KennelListView() {
  const table = useTable({ defaultRowsPerPage: 25 });

  const filters = useSetState<IKennelTableFilters>({ search: '', city: '' });
  const { state: currentFilters } = filters;

  const { kennels, kennelsTotal, kennelsLoading, kennelsEmpty } = useGetKennelsList({
    page: table.page + 1,
    per_page: table.rowsPerPage,
    search: currentFilters.search || undefined,
    city: currentFilters.city || undefined,
  });

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteKennel(id);
        toast.success('Delete success!');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Delete failed');
      }
    },
    []
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Kennels"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Kennels' }]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.kennels.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Add kennel
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <KennelTableToolbar filters={filters} onResetPage={table.onResetPage} />

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom headCells={TABLE_HEAD} rowCount={kennels.length} />

              <TableBody>
                {kennels.map((row) => (
                  <KennelTableRow
                    key={row.id}
                    row={row}
                    editHref={paths.dashboard.kennels.edit(row.id)}
                    onDeleteRow={() => handleDelete(row.id)}
                  />
                ))}

                <TableNoData notFound={!kennelsLoading && kennelsEmpty} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={kennelsTotal}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
