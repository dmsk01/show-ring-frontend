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

import { usePermissions } from 'src/hooks/use-permissions';

import { useTranslate } from 'src/locales';
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

export function LitterListView() {
  const { t } = useTranslate(['litter', 'common']);
  const { can } = usePermissions();

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'breed', label: t('list.columns.breed') },
    { id: 'kennel', label: t('list.columns.kennel'), width: 200 },
    { id: 'status', label: t('list.columns.status'), width: 120 },
    { id: 'born_at', label: t('list.columns.born'), width: 140 },
    { id: 'puppies_count', label: t('list.columns.puppies'), width: 100 },
    { id: 'price', label: t('list.columns.price'), width: 140 },
  ];

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
        heading={t('list.title')}
        links={[{ name: t('common:dashboard'), href: paths.dashboard.root }, { name: t('list.title') }]}
        action={
          can('litters:create') ? (
            <Button
              component={RouterLink}
              href={paths.dashboard.litters.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('list.new')}
            </Button>
          ) : undefined
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
