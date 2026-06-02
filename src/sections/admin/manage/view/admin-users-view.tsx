'use client';

import type { TableHeadCellProps } from 'src/components/table';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';

import { useGetAdminUsers } from 'src/actions/admin';
import { DashboardContent } from 'src/layouts/dashboard';

import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableHeadCustom } from 'src/components/table';

import { AdminUserRow } from '../admin-user-row';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'email', label: 'Email' },
  { id: 'verified', label: 'Verified', width: 140 },
  { id: 'roles', label: 'Roles' },
  { id: 'active', label: 'Active', width: 100, align: 'right' },
];

export function AdminUsersView() {
  const table = useTable();
  const { users, usersLoading } = useGetAdminUsers();

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Users"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Admin' },
          { name: 'Users' },
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
