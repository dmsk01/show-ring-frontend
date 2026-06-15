'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { usePermissions } from 'src/hooks/use-permissions';

import { useTranslate } from 'src/locales';
import { useGetShows } from 'src/actions/show';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { ShowcaseShell } from 'src/sections/showcase';

import { classifyShow } from '../show-utils';
import { ShowCardGrid } from '../show-card-grid';

// ----------------------------------------------------------------------

type Bucket = 'upcoming' | 'past';

export function ShowShowcaseView() {
  const { t } = useTranslate('show');
  const { can } = usePermissions();
  const [bucket, setBucket] = useState<Bucket>('upcoming');
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Addendum: past tab → server-filter status=completed + sort desc;
  // upcoming tab → no status filter + sort asc, then client-side bucket filter.
  const { shows, showsTotal, showsLoading, showsEmpty } = useGetShows({
    page: page + 1,
    per_page: rowsPerPage,
    status: bucket === 'past' ? 'completed' : undefined,
    city: city || undefined,
    search: search || undefined,
    sort_by: 'date_start',
    order: bucket === 'past' ? 'desc' : 'asc',
  });

  const visible =
    bucket === 'past' ? shows : shows.filter((s) => classifyShow(s.status) === 'upcoming');

  const handleBucket = (_e: React.SyntheticEvent, value: Bucket) => {
    setBucket(value);
    setPage(0);
  };

  const handleCity = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCity(event.target.value);
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  return (
    <ShowcaseShell
      title={t('showcase.title')}
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
    >
      <Tabs value={bucket} onChange={handleBucket} sx={{ mb: { xs: 3, md: 3 } }}>
        <Tab value="upcoming" label={t('showcase.upcoming')} />
        <Tab value="past" label={t('showcase.past')} />
      </Tabs>

      <Box
        sx={{
          mb: { xs: 3, md: 5 },
          gap: 2,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          value={city}
          onChange={handleCity}
          placeholder={t('list.filters.city')}
          sx={{ width: { xs: 1, md: 240 } }}
        />

        <TextField
          value={search}
          onChange={handleSearch}
          placeholder={t('list.search')}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ flex: 1, minWidth: 240 }}
        />
      </Box>

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
