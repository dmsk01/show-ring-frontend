'use client';

import type { TableHeadCellProps } from 'src/components/table';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { usePermissions } from 'src/hooks/use-permissions';

import { useTranslate } from 'src/locales';
import { useGetCampaigns } from 'src/actions/ad';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableHeadCustom } from 'src/components/table';

import { CampaignTableRow } from '../campaign-table-row';

// ----------------------------------------------------------------------

export function CampaignListView() {
  const { t } = useTranslate(['ad', 'common']);
  const { can } = usePermissions();
  const table = useTable();
  const { campaigns, campaignsLoading, campaignsEmpty } = useGetCampaigns();

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'name', label: t('list.columns.name') },
    { id: 'status', label: t('list.columns.status'), width: 120 },
    { id: 'budget', label: t('list.columns.budget'), width: 120 },
    { id: 'spent', label: t('list.columns.spent'), width: 120 },
    { id: 'dates', label: t('list.columns.dates'), width: 220 },
  ];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('list.title')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title') },
        ]}
        action={
          can('ads:create') ? (
            <Button
              component={RouterLink}
              href={paths.dashboard.ads.new}
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
        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 880 }}>
              <TableHeadCustom headCells={TABLE_HEAD} rowCount={campaigns.length} />

              <TableBody>
                {campaigns.map((row) => (
                  <CampaignTableRow
                    key={row.id}
                    row={row}
                    editHref={paths.dashboard.ads.edit(row.id)}
                  />
                ))}

                <TableNoData notFound={!campaignsLoading && campaignsEmpty} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>
      </Card>
    </DashboardContent>
  );
}
