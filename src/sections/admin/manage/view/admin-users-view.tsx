'use client';

import type { TableHeadCellProps } from 'src/components/table';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetAdminUsers } from 'src/actions/admin';
import { DashboardContent } from 'src/layouts/dashboard';

import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableHeadCustom } from 'src/components/table';

import { AdminUserRow } from '../admin-user-row';

// ----------------------------------------------------------------------

export function AdminUsersView() {
  const { t } = useTranslate(['admin', 'common']);
  const table = useTable();
  const { users, usersLoading } = useGetAdminUsers();

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'email', label: t('users.columns.email') },
    { id: 'verified', label: t('users.columns.verified'), width: 140 },
    { id: 'roles', label: t('users.columns.roles') },
    { id: 'active', label: t('users.columns.active'), width: 100, align: 'right' },
  ];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('users.list.title')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('breadcrumb.admin') },
          { name: t('users.list.breadcrumb') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
              <TableHeadCustom headCells={TABLE_HEAD} rowCount={users.length} />
              <TableBody>
                {users.map((row) => (
                  <AdminUserRow key={row.id} row={row} />
                ))}
                <TableNoData notFound={!usersLoading && users.length === 0} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>
      </Card>
    </DashboardContent>
  );
}
