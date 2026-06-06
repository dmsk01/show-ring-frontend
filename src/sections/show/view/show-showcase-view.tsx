'use client';

import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TablePagination from '@mui/material/TablePagination';

import { useTranslate } from 'src/locales';
import { useGetShows } from 'src/actions/show';

import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { ShowcaseShell } from 'src/sections/showcase';

import { classifyShow } from '../show-utils';
import { ShowCardGrid } from '../show-card-grid';

// ----------------------------------------------------------------------

type Bucket = 'upcoming' | 'past';

export function ShowShowcaseView() {
  const { t } = useTranslate('show');
  const [bucket, setBucket] = useState<Bucket>('upcoming');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Addendum: past tab → server-filter status=completed + sort desc;
  // upcoming tab → no status filter + sort asc, then client-side bucket filter.
  const { shows, showsTotal, showsLoading, showsEmpty } = useGetShows({
    page: page + 1,
    per_page: rowsPerPage,
    status: bucket === 'past' ? 'completed' : undefined,
    sort_by: 'date_start',
    order: bucket === 'past' ? 'desc' : 'asc',
  });

  const visible =
    bucket === 'past' ? shows : shows.filter((s) => classifyShow(s.status) === 'upcoming');

  const handleBucket = (_e: React.SyntheticEvent, value: Bucket) => {
    setBucket(value);
    setPage(0);
  };

  return (
    <ShowcaseShell title={t('showcase.title')}>
      <Tabs value={bucket} onChange={handleBucket} sx={{ mb: { xs: 3, md: 5 } }}>
        <Tab value="upcoming" label={t('showcase.upcoming')} />
        <Tab value="past" label={t('showcase.past')} />
      </Tabs>

      {showsLoading ? (
        <LoadingScreen />
      ) : showsEmpty || visible.length === 0 ? (
        <EmptyContent filled title={t('showcase.empty')} sx={{ py: 10 }} />
      ) : (
        <>
          <ShowCardGrid shows={visible} />
          <TablePagination
            component="div"
            page={page}
            count={showsTotal}
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
    </ShowcaseShell>
  );
}
