'use client';

import { useState, useCallback } from 'react';
import { useSetState } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import { useGetClassifieds } from 'src/actions/classified';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { ShowcaseShell } from 'src/sections/showcase';

import { CLASSIFIED_CATEGORIES } from 'src/types/classified';

import { ClassifiedCardGrid } from '../classified-card-grid';

// ----------------------------------------------------------------------

const CATEGORY_LABEL: Record<string, string> = {
  puppy_sale: 'Щенки',
  adult_sale: 'Взрослые',
  mating: 'Вязка',
  handler: 'Хендлер',
  grooming: 'Груминг',
  other: 'Другое',
};

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Сначала новые' },
  { value: 'price:asc', label: 'Дешевле' },
  { value: 'price:desc', label: 'Дороже' },
  { value: 'views_count:desc', label: 'Популярные' },
];

export function ClassifiedShowcaseView() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [sort, setSort] = useState('created_at:desc');

  const filters = useSetState<{ search: string; category: string; city: string }>({
    search: '',
    category: 'all',
    city: '',
  });
  const { state, setState } = filters;

  const [sortBy, order] = sort.split(':') as [
    'created_at' | 'price' | 'views_count',
    'asc' | 'desc',
  ];

  const { classifieds, classifiedsTotal, classifiedsLoading, classifiedsEmpty } =
    useGetClassifieds({
      page: page + 1,
      per_page: rowsPerPage,
      category: state.category === 'all' ? undefined : state.category,
      city: state.city || undefined,
      sort_by: sortBy,
      order,
    });

  // Backend list does not filter by status yet — keep only active publicly.
  const visible = classifieds.filter((c) => c.status === 'active');

  // Client-side search within the current page (backend has no `search` param).
  const filtered = state.search
    ? visible.filter((c) => c.title.toLowerCase().includes(state.search.toLowerCase()))
    : visible;

  const handleField = useCallback(
    (field: 'search' | 'category' | 'city', value: string) => {
      setPage(0);
      setState({ [field]: value });
    },
    [setState]
  );

  return (
    <ShowcaseShell title="Животные — объявления">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: { xs: 3, md: 5 } }}>
        <TextField
          fullWidth
          value={state.search}
          onChange={(e) => handleField('search', e.target.value)}
          placeholder="Поиск по заголовку..."
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
          select
          value={state.category}
          onChange={(e) => handleField('category', e.target.value)}
          sx={{ width: { xs: 1, sm: 200 } }}
        >
          <MenuItem value="all">Все категории</MenuItem>
          {CLASSIFIED_CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          value={state.city}
          onChange={(e) => handleField('city', e.target.value)}
          placeholder="Город"
          sx={{ width: { xs: 1, sm: 200 } }}
        />
        <TextField
          select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(0);
          }}
          sx={{ width: { xs: 1, sm: 200 } }}
        >
          {SORT_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {classifiedsLoading ? (
        <LoadingScreen />
      ) : classifiedsEmpty || filtered.length === 0 ? (
        <EmptyContent filled title="Объявления не найдены" sx={{ py: 10 }} />
      ) : (
        <>
          <ClassifiedCardGrid classifieds={filtered} />
          <TablePagination
            component="div"
            page={page}
            count={classifiedsTotal}
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
