'use client';

import type { IKennelTableFilters } from 'src/types/kennel';

import { useState, useCallback } from 'react';
import { useSetState } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import { useTranslate } from 'src/locales';
import { useGetKennelsList } from 'src/actions/kennel';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { ShowcaseShell } from 'src/sections/showcase';

import { KennelCardGrid } from '../kennel-card-grid';

// ----------------------------------------------------------------------

type SortOption = 'created_at:desc' | 'name:asc';

export function KennelShowcaseView() {
  const { t } = useTranslate(['kennel', 'common']);

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'created_at:desc', label: t('showcase.sort.newest') },
    { value: 'name:asc', label: t('showcase.sort.name') },
  ];

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [sort, setSort] = useState<SortOption>('created_at:desc');

  const filters = useSetState<IKennelTableFilters>({ search: '', city: '' });
  const { state: currentFilters, setState } = filters;

  const [sortBy, order] = sort.split(':') as ['name' | 'created_at', 'asc' | 'desc'];

  const { kennels, kennelsTotal, kennelsLoading, kennelsEmpty } = useGetKennelsList({
    page: page + 1,
    per_page: rowsPerPage,
    search: currentFilters.search || undefined,
    city: currentFilters.city || undefined,
    sort_by: sortBy,
    order,
  });

  const handleSearch = useCallback(
    (value: string) => {
      setPage(0);
      setState({ search: value });
    },
    [setState]
  );

  return (
    <ShowcaseShell title={t('showcase.title')}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <TextField
          fullWidth
          value={currentFilters.search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t('showcase.searchPlaceholder')}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          value={currentFilters.city}
          onChange={(e) => {
            setPage(0);
            setState({ city: e.target.value });
          }}
          placeholder={t('showcase.cityPlaceholder')}
          sx={{ width: { xs: 1, sm: 240 } }}
        />
        <TextField
          select
          value={sort}
          onChange={(e) => {
            setPage(0);
            setSort(e.target.value as SortOption);
          }}
          sx={{ width: { xs: 1, sm: 200 } }}
        >
          {SORT_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {kennelsLoading ? (
        <LoadingScreen />
      ) : kennelsEmpty ? (
        <EmptyContent filled title={t('showcase.empty')} sx={{ py: 10 }} />
      ) : (
        <>
          <KennelCardGrid kennels={kennels} />
          <TablePagination
            component="div"
            page={page}
            count={kennelsTotal}
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
