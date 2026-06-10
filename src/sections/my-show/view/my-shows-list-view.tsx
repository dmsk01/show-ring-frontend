'use client';

import type { MyShowStatusGroup } from 'src/types/show';

import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useMyShows } from 'src/actions/my-show';
import { DashboardContent } from 'src/layouts/dashboard';

import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { MyShowCardGrid } from '../my-show-card-grid';

// ----------------------------------------------------------------------

const TABS: MyShowStatusGroup[] = ['all', 'active', 'past'];

export function MyShowsListView() {
  const { t } = useTranslate('show');
  const [group, setGroup] = useState<MyShowStatusGroup>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const { items, total, isLoading, isEmpty } = useMyShows({
    statusGroup: group,
    page: page + 1,
    perPage: rowsPerPage,
  });

  const handleGroup = (_e: React.SyntheticEvent, value: MyShowStatusGroup) => {
    setGroup(value);
    setPage(0);
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('myShows.title')}
        links={[{ name: t('myShows.breadcrumb'), href: paths.dashboard.myShows.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={group} onChange={handleGroup} sx={{ mb: { xs: 3, md: 5 } }}>
        {TABS.map((value) => (
          <Tab key={value} value={value} label={t(`myShows.tabs.${value}`)} />
        ))}
      </Tabs>

      {isLoading ? (
        <LoadingScreen />
      ) : isEmpty ? (
        <EmptyContent
          filled
          title={t('myShows.empty.title')}
          description={t('myShows.empty.description')}
          sx={{ py: 10 }}
        />
      ) : (
        <>
          <MyShowCardGrid shows={items} />
          <TablePagination
            component="div"
            page={page}
            count={total}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[12, 24, 48]}
            onPageChange={(_e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{ mt: 3 }}
          />
        </>
      )}
    </DashboardContent>
  );
}
