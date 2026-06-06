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

import { useTranslate } from 'src/locales';
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
  const { t } = useTranslate(['admin', 'common']);
  const { items, loading } = useGetModerationClassifieds();

  const decide = async (id: string, approve: boolean) => {
    try {
      await decideClassified(id, approve);
      toast.success(approve ? t('moderation.toast.approved') : t('moderation.toast.rejected'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('moderation.toast.failed'));
    }
  };

  return (
    <Scrollbar>
      <Table sx={{ minWidth: 720 }}>
        <TableHeadCustom
          headCells={[
            { id: 'title', label: t('moderation.classifieds.columns.title') },
            { id: 'category', label: t('moderation.classifieds.columns.category'), width: 160 },
            { id: 'status', label: t('moderation.classifieds.columns.status'), width: 140 },
            { id: '', label: t('moderation.classifieds.columns.decision'), width: 200, align: 'right' },
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
                    {t('moderation.classifieds.actions.approve')}
                  </Button>
                  <Button size="small" color="error" variant="soft" onClick={() => decide(row.id, false)}>
                    {t('moderation.classifieds.actions.reject')}
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
  const { t } = useTranslate(['admin', 'common']);
  const { items, loading } = useGetModerationKennels();

  const toggle = async (id: string, isVerified: boolean) => {
    try {
      await verifyKennel(id, isVerified);
      toast.success(isVerified ? t('moderation.toast.verified') : t('moderation.toast.unverified'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('moderation.toast.failed'));
    }
  };

  return (
    <Scrollbar>
      <Table sx={{ minWidth: 640 }}>
        <TableHeadCustom
          headCells={[
            { id: 'name', label: t('moderation.kennels.columns.name') },
            { id: 'prefix', label: t('moderation.kennels.columns.prefix'), width: 200 },
            { id: 'verified', label: t('moderation.kennels.columns.verified'), width: 120, align: 'right' },
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
  const { t } = useTranslate(['admin', 'common']);
  const [tab, setTab] = useState('classifieds');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('moderation.list.title')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('breadcrumb.admin') },
          { name: t('moderation.list.breadcrumb') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="classifieds" label={t('moderation.tabs.classifieds')} />
        <Tab value="kennels" label={t('moderation.tabs.kennels')} />
      </Tabs>

      <Card>
        <Box sx={{ position: 'relative' }}>
          {tab === 'classifieds' ? <ClassifiedsModeration /> : <KennelsModeration />}
        </Box>
      </Card>
    </DashboardContent>
  );
}
