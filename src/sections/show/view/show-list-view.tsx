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

import { usePermissions } from 'src/hooks/use-permissions';

import { useTranslate } from 'src/locales';
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

export function ShowListView() {
  const { t } = useTranslate(['show', 'common']);
  const { can } = usePermissions();

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'name', label: t('list.columns.name') },
    { id: 'rank', label: t('list.columns.rank'), width: 160 },
    { id: 'date_start', label: t('list.columns.dateStart'), width: 140 },
    { id: 'city', label: t('list.columns.city'), width: 160 },
    { id: 'status', label: t('list.columns.status'), width: 160 },
  ];

  const table = useTable({ defaultRowsPerPage: 25 });

  const filters = useSetState<IShowFilters>({ status: 'all', city: '', search: '' });
  const { state: currentFilters } = filters;

  const { items: ranks } = useReferenceList('/references/show-ranks');

  const { shows, showsTotal, showsLoading, showsEmpty } = useGetShows({
    page: table.page + 1,
    per_page: table.rowsPerPage,
    status: currentFilters.status,
    city: currentFilters.city || undefined,
    search: currentFilters.search || undefined,
  });

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('list.title')}
        links={[{ name: t('common:dashboard'), href: paths.dashboard.root }, { name: t('list.title') }]}
        action={
          can('shows:create') ? (
            <Button
              component={RouterLink}
              href={paths.dashboard.shows.new}
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
