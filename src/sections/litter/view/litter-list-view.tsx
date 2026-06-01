'use client';

import type { ILitterTableFilters } from 'src/types/litter';
import type { TableHeadCellProps } from 'src/components/table';

import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetLittersList } from 'src/actions/litter';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetBreeds, useGetKennels } from 'src/actions/reference';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { LitterTableRow } from '../litter-table-row';
import { LitterTableToolbar } from '../litter-table-toolbar';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'breed', label: 'Breed' },
  { id: 'kennel', label: 'Kennel', width: 200 },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'born_at', label: 'Born', width: 140 },
  { id: 'puppies_count', label: 'Puppies', width: 100 },
  { id: 'price', label: 'Price', width: 140 },
];

export function LitterListView() {
  const table = useTable({ defaultRowsPerPage: 25 });

  const filters = useSetState<ILitterTableFilters>({ breed_id: '', status: 'all' });
  const { state: currentFilters } = filters;

  const { breeds } = useGetBreeds();
  const { kennels } = useGetKennels();

  const { litters, littersTotal, littersLoading, littersEmpty } = useGetLittersList({
    page: table.page + 1,
    per_page: table.rowsPerPage,
    breed_id: currentFilters.breed_id || undefined,
    status: currentFilters.status,
  });

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Litters"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Litters' }]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.litters.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Add litter
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <LitterTableToolbar filters={filters} onResetPage={table.onResetPage} breedOptions={breeds} />

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom headCells={TABLE_HEAD} rowCount={litters.length} />

              <TableBody>
                {litters.map((row) => (
                  <LitterTableRow
                    key={row.id}
                    row={row}
                    breedName={breeds.find((breed) => breed.id === row.breed_id)?.name}
                    kennelName={kennels.find((kennel) => kennel.id === row.kennel_id)?.name}
                    editHref={paths.dashboard.litters.edit(row.id)}
                  />
                ))}

                <TableNoData notFound={!littersLoading && littersEmpty} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={littersTotal}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
