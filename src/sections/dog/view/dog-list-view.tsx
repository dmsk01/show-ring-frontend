'use client';

import type { DogSex, IDogTableFilters } from 'src/types/dog';
import type { TableHeadCellProps } from 'src/components/table';

import { useEffect } from 'react';
import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, usePathname, useSearchParams } from 'src/routes/hooks';

import { usePermissions } from 'src/hooks/use-permissions';

import { useTranslate } from 'src/locales';
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

import { useAuthContext } from 'src/auth/hooks';

import { canManageDog } from '../dog-utils';
import { DogTableRow } from '../dog-table-row';
import { DogTableToolbar } from '../dog-table-toolbar';
import { DogTableFiltersResult } from '../dog-table-filters-result';

// ----------------------------------------------------------------------

export function DogListView() {
  const { t } = useTranslate(['dog', 'common']);
  const { user } = useAuthContext();
  const { can } = usePermissions();

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'name', label: t('list.columns.name') },
    { id: 'breed', label: t('list.columns.breed'), width: 200 },
    { id: 'sex', label: t('list.columns.sex'), width: 120 },
    { id: 'rkf_number', label: t('list.columns.rkfNumber'), width: 160 },
    { id: 'date_of_birth', label: t('list.columns.born'), width: 140 },
    { id: 'color', label: t('list.columns.color'), width: 160 },
    { id: '', width: 88 },
  ];

  // Persist search/filters/page in the URL so they survive navigating away and
  // back (and are shareable). Seeded once from the address bar on mount.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get('page'));

  const table = useTable({
    defaultRowsPerPage: 25,
    defaultCurrentPage: pageParam > 1 ? pageParam - 1 : 0,
  });

  const filters = useSetState<IDogTableFilters>({
    search: searchParams.get('search') ?? '',
    breed_id: searchParams.get('breed_id') ?? '',
    kennel_id: searchParams.get('kennel_id') ?? '',
    sex: (searchParams.get('sex') as DogSex | 'all') ?? 'all',
  });
  const { state: currentFilters } = filters;

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentFilters.search) params.set('search', currentFilters.search);
    if (currentFilters.breed_id) params.set('breed_id', currentFilters.breed_id);
    if (currentFilters.sex !== 'all') params.set('sex', currentFilters.sex);
    if (table.page > 0) params.set('page', String(table.page + 1));

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [
    currentFilters.search,
    currentFilters.breed_id,
    currentFilters.sex,
    table.page,
    pathname,
    router,
  ]);

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
        heading={t('list.title')}
        links={[{ name: t('common:dashboard'), href: paths.dashboard.root }, { name: t('list.title') }]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.dogs.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('list.new')}
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
    </DashboardContent>
  );
}
