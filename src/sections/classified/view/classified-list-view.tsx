'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IClassifiedFilters, AnimalAvailability } from 'src/types/classified';

import { useCallback } from 'react';
import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { deleteClassified, updateClassified, useGetClassifieds } from 'src/actions/classified';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { ClassifiedTableRow } from '../classified-table-row';
import { ClassifiedTableToolbar } from '../classified-table-toolbar';

// ----------------------------------------------------------------------

export function ClassifiedListView() {
  const { t } = useTranslate(['classified', 'common']);

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'title', label: t('list.columns.title') },
    { id: 'category', label: t('list.columns.category'), width: 160 },
    { id: 'price', label: t('list.columns.price'), width: 120 },
    { id: 'city', label: t('list.columns.city'), width: 140 },
    { id: 'availability', label: t('list.columns.availability'), width: 130 },
    { id: 'status', label: t('list.columns.status'), width: 120 },
    { id: '', width: 88 },
  ];

  const table = useTable({ defaultRowsPerPage: 25 });

  const filters = useSetState<IClassifiedFilters>({ search: '', category: 'all', city: '' });
  const { state: currentFilters } = filters;

  const { classifieds, classifiedsTotal, classifiedsLoading, classifiedsEmpty } = useGetClassifieds({
    page: table.page + 1,
    per_page: table.rowsPerPage,
    category: currentFilters.category,
    city: currentFilters.city || undefined,
  });

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteClassified(id);
      toast.success(t('toast.deleted'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.deleteFailed'));
    }
  }, [t]);

  const handleChangeAvailability = useCallback(
    async (id: string, availability: AnimalAvailability) => {
      try {
        await updateClassified(id, { availability });
        toast.success(t('toast.updated'));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('common:state.error'));
      }
    },
    [t]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('list.title')}
        links={[{ name: t('common:dashboard'), href: paths.dashboard.root }, { name: t('list.title') }]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.classifieds.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('list.new')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <ClassifiedTableToolbar filters={filters} onResetPage={table.onResetPage} />

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 1080 }}>
              <TableHeadCustom headCells={TABLE_HEAD} rowCount={classifieds.length} />

              <TableBody>
                {classifieds.map((row) => (
                  <ClassifiedTableRow
                    key={row.id}
                    row={row}
                    editHref={paths.dashboard.classifieds.edit(row.id)}
                    onDeleteRow={() => handleDelete(row.id)}
                    onChangeAvailability={(availability) =>
                      handleChangeAvailability(row.id, availability)
                    }
                  />
                ))}

                <TableNoData notFound={!classifiedsLoading && classifiedsEmpty} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={classifiedsTotal}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
