'use client';

import type { TableHeadCellProps } from 'src/components/table';

import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { usePermissions } from 'src/hooks/use-permissions';

import { useTranslate } from 'src/locales';
import { useGetMyDogs } from 'src/actions/dog';
import { useGetBreeds } from 'src/actions/reference';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { canManageDog } from '../dog-utils';
import { DogTableRow } from '../dog-table-row';

// ----------------------------------------------------------------------

export function MyDogsView() {
  const { t } = useTranslate(['dog', 'common']);

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'name', label: t('list.columns.name') },
    { id: 'breed', label: t('list.columns.breed'), width: 200 },
    { id: 'sex', label: t('list.columns.sex'), width: 120 },
    { id: 'rkf_number', label: t('list.columns.rkfNumber'), width: 160 },
    { id: 'date_of_birth', label: t('list.columns.born'), width: 140 },
    { id: 'color', label: t('list.columns.color'), width: 160 },
    { id: '', width: 88 },
  ];

  const { user } = useAuthContext();
  const { can } = usePermissions();

  const table = useTable({ defaultRowsPerPage: 25 });
  const { breeds } = useGetBreeds();

  const { dogs, dogsTotal, dogsLoading, dogsError, dogsEmpty } = useGetMyDogs({
    page: table.page + 1, // backend is 1-based
    per_page: table.rowsPerPage,
  });

  // Если текущая страница опустела (например, после удаления) — назад на первую.
  useEffect(() => {
    if (!dogsLoading && dogs.length === 0 && dogsTotal > 0 && table.page > 0) {
      table.onResetPage();
    }
  }, [dogsLoading, dogs.length, dogsTotal, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('myDogs.title')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('myDogs.title') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.dogs.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('myDogs.add')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {dogsLoading ? (
        <LoadingScreen />
      ) : dogsError ? (
        <EmptyContent filled title={t('myDogs.error')} sx={{ py: 10 }} />
      ) : dogsEmpty ? (
        <EmptyContent filled title={t('myDogs.empty')} sx={{ py: 10 }} />
      ) : (
        <Card>
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
                      // Свои собаки редактируемы по определению; хелпер — на
                      // случай легаси-строк с owner_id=null.
                      canEdit={canManageDog(row, user?.id, can)}
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
      )}
    </DashboardContent>
  );
}
