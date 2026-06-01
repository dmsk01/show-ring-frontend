'use client';

import type { IDogTableFilters } from 'src/types/dog';
import type { TableHeadCellProps } from 'src/components/table';

import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetDogs } from 'src/actions/dog';
import { useGetBreeds } from 'src/actions/reference';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { DogTableRow } from '../dog-table-row';
import { DogTableToolbar } from '../dog-table-toolbar';
import { DogTableFiltersResult } from '../dog-table-filters-result';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'name', label: 'Name' },
  { id: 'breed', label: 'Breed', width: 200 },
  { id: 'sex', label: 'Sex', width: 120 },
  { id: 'rkf_number', label: 'RKF #', width: 160 },
  { id: 'date_of_birth', label: 'Born', width: 140 },
  { id: 'color', label: 'Color', width: 160 },
  { id: '', width: 88 },
];

export function DogListView() {
  const table = useTable({ defaultRowsPerPage: 25 });

  const filters = useSetState<IDogTableFilters>({ search: '', breed_id: '', kennel_id: '', sex: 'all' });
  const { state: currentFilters } = filters;

  const { breeds } = useGetBreeds();

  const { dogs, dogsTotal, dogsLoading, dogsEmpty } = useGetDogs({
    page: table.page + 1, // backend is 1-based
    per_page: table.rowsPerPage,
    search: currentFilters.search || undefined,
    breed_id: currentFilters.breed_id || undefined,
    sex: currentFilters.sex,
  });

  const canReset = !!currentFilters.search || !!currentFilters.breed_id || currentFilters.sex !== 'all';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Dogs"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Dogs' }]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.dogs.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Add dog
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <DogTableToolbar filters={filters} onResetPage={table.onResetPage} breedOptions={breeds} />

        {canReset && (
          <DogTableFiltersResult filters={filters} totalResults={dogsTotal} sx={{ p: 2.5, pt: 0 }} />
        )}

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom headCells={TABLE_HEAD} rowCount={dogs.length} />

              <TableBody>
                {dogs.map((row) => (
                  <DogTableRow
                    key={row.id}
                    row={row}
                    breedName={breeds.find((breed) => breed.id === row.breed_id)?.name}
                    detailsHref={paths.dashboard.dogs.details(row.id)}
                    editHref={paths.dashboard.dogs.edit(row.id)}
                  />
                ))}

                <TableNoData notFound={!dogsLoading && dogsEmpty} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={dogsTotal}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
