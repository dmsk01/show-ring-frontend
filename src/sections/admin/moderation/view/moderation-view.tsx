'use client';

import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  verifyKennel,
  decideClassified,
  useGetModerationKennels,
  useGetModerationClassifieds,
} from 'src/actions/admin';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { TableNoData, TableHeadCustom } from 'src/components/table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

function ClassifiedsModeration() {
  const { items, loading } = useGetModerationClassifieds();

  const decide = async (id: string, approve: boolean) => {
    try {
      await decideClassified(id, approve);
      toast.success(approve ? 'Approved' : 'Rejected');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed');
    }
  };

  return (
    <Scrollbar>
      <Table sx={{ minWidth: 720 }}>
        <TableHeadCustom
          headCells={[
            { id: 'title', label: 'Title' },
            { id: 'category', label: 'Category', width: 160 },
            { id: 'status', label: 'Status', width: 140 },
            { id: '', label: 'Decision', width: 200, align: 'right' },
          ]}
        />
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{row.title}</TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>
                {row.category.replace('_', ' ')}
              </TableCell>
              <TableCell>
                <Label color="warning">{row.status}</Label>
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                  <Button size="small" color="success" variant="soft" onClick={() => decide(row.id, true)}>
                    Approve
                  </Button>
                  <Button size="small" color="error" variant="soft" onClick={() => decide(row.id, false)}>
                    Reject
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          <TableNoData notFound={!loading && items.length === 0} />
        </TableBody>
      </Table>
    </Scrollbar>
  );
}

function KennelsModeration() {
  const { items, loading } = useGetModerationKennels();

  const toggle = async (id: string, isVerified: boolean) => {
    try {
      await verifyKennel(id, isVerified);
      toast.success(isVerified ? 'Verified' : 'Unverified');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed');
    }
  };

  return (
    <Scrollbar>
      <Table sx={{ minWidth: 640 }}>
        <TableHeadCustom
          headCells={[
            { id: 'name', label: 'Kennel' },
            { id: 'prefix', label: 'Prefix', width: 200 },
            { id: 'verified', label: 'Verified', width: 120, align: 'right' },
          ]}
        />
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
              <TableCell>{row.kennel_prefix ?? '—'}</TableCell>
              <TableCell align="right">
                <Switch
                  checked={row.is_verified}
                  onChange={(_, checked) => toggle(row.id, checked)}
                />
              </TableCell>
            </TableRow>
          ))}
          <TableNoData notFound={!loading && items.length === 0} />
        </TableBody>
      </Table>
    </Scrollbar>
  );
}

export function ModerationView() {
  const [tab, setTab] = useState('classifieds');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Moderation"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Admin' },
          { name: 'Moderation' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="classifieds" label="Classifieds" />
        <Tab value="kennels" label="Kennels" />
      </Tabs>

      <Card>
        <Box sx={{ position: 'relative' }}>
          {tab === 'classifieds' ? <ClassifiedsModeration /> : <KennelsModeration />}
        </Box>
      </Card>
    </DashboardContent>
  );
}
