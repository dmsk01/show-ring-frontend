'use client';

import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import { useRouter, usePathname, useSearchParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { useGetBreeds } from 'src/actions/reference';
import { useGetClassifieds } from 'src/actions/classified';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { ShowcaseShell } from 'src/sections/showcase';

import { CLASSIFIED_CATEGORIES, ANIMAL_AVAILABILITIES } from 'src/types/classified';

import { ClassifiedCardGrid } from '../classified-card-grid';
import { classifiedCategoryI18nKey, classifiedAvailabilityI18nKey } from '../classified-utils';

// ----------------------------------------------------------------------

type ShowcaseFilters = {
  search: string;
  category: string;
  city: string;
  breed_id: string;
  sex: 'male' | 'female' | 'all';
  availability: 'available' | 'reserved' | 'sold' | 'all';
  price_from: string;
  price_to: string;
};

export function ClassifiedShowcaseView() {
  const { t } = useTranslate(['classified', 'common']);

  const SORT_OPTIONS = [
    { value: 'created_at:desc', label: t('showcase.sort.newestFirst') },
    { value: 'price:asc', label: t('showcase.sort.cheapest') },
    { value: 'price:desc', label: t('showcase.sort.mostExpensive') },
    { value: 'views_count:desc', label: t('showcase.sort.popular') },
  ];

  // Persist search/filters/page in the URL so they survive navigating away and
  // back (and are shareable). Seeded once from the address bar on mount.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get('page'));

  const [page, setPage] = useState(pageParam > 1 ? pageParam - 1 : 0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [sort, setSort] = useState('created_at:desc');

  const filters = useSetState<ShowcaseFilters>({
    search: searchParams.get('search') ?? '',
    category: searchParams.get('category') ?? 'all',
    city: searchParams.get('city') ?? '',
    breed_id: searchParams.get('breed_id') ?? '',
    sex: (searchParams.get('sex') as ShowcaseFilters['sex']) || 'all',
    availability: (searchParams.get('availability') as ShowcaseFilters['availability']) || 'all',
    price_from: searchParams.get('price_from') ?? '',
    price_to: searchParams.get('price_to') ?? '',
  });
  const { state, setState } = filters;

  useEffect(() => {
    const params = new URLSearchParams();
    if (state.search) params.set('search', state.search);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.city) params.set('city', state.city);
    if (state.breed_id) params.set('breed_id', state.breed_id);
    if (state.sex !== 'all') params.set('sex', state.sex);
    if (state.availability !== 'all') params.set('availability', state.availability);
    if (state.price_from) params.set('price_from', state.price_from);
    if (state.price_to) params.set('price_to', state.price_to);
    if (page > 0) params.set('page', String(page + 1));

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [state, page, pathname, router]);

  const { breeds } = useGetBreeds();

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
      breed_id: state.breed_id || undefined,
      sex: state.sex === 'all' ? undefined : state.sex,
      availability: state.availability === 'all' ? undefined : state.availability,
      price_from: state.price_from ? Number(state.price_from) : undefined,
      price_to: state.price_to ? Number(state.price_to) : undefined,
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
    (field: keyof ShowcaseFilters, value: string) => {
      setPage(0);
      setState({ [field]: value });
    },
    [setState]
  );

  return (
    <ShowcaseShell title={t('showcase.title')}>
      <Stack spacing={2} sx={{ mb: { xs: 3, md: 5 } }}>
        <TextField
          fullWidth
          value={state.search}
          onChange={(e) => handleField('search', e.target.value)}
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

        <Box
          sx={{
            gap: 2,
            display: 'flex',
            flexWrap: 'wrap',
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <TextField
            select
            label={t('showcase.category')}
            value={state.category}
            onChange={(e) => handleField('category', e.target.value)}
            sx={{ width: { xs: 1, sm: 180 } }}
          >
            <MenuItem value="all">{t('showcase.allCategories')}</MenuItem>
            {CLASSIFIED_CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {t(classifiedCategoryI18nKey(cat))}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label={t('showcase.breed')}
            value={state.breed_id}
            onChange={(e) => handleField('breed_id', e.target.value)}
            sx={{ width: { xs: 1, sm: 200 } }}
          >
            <MenuItem value="">{t('showcase.allBreeds')}</MenuItem>
            {breeds.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label={t('showcase.sex')}
            value={state.sex}
            onChange={(e) => handleField('sex', e.target.value)}
            sx={{ width: { xs: 1, sm: 150 } }}
          >
            <MenuItem value="all">{t('showcase.anySex')}</MenuItem>
            <MenuItem value="male">{t('enums.sex.male')}</MenuItem>
            <MenuItem value="female">{t('enums.sex.female')}</MenuItem>
          </TextField>

          <TextField
            select
            label={t('showcase.availability')}
            value={state.availability}
            onChange={(e) => handleField('availability', e.target.value)}
            sx={{ width: { xs: 1, sm: 170 } }}
          >
            <MenuItem value="all">{t('showcase.anyAvailability')}</MenuItem>
            {ANIMAL_AVAILABILITIES.map((value) => (
              <MenuItem key={value} value={value}>
                {t(classifiedAvailabilityI18nKey(value))}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="number"
            label={t('showcase.priceFrom')}
            value={state.price_from}
            onChange={(e) => handleField('price_from', e.target.value)}
            slotProps={{ htmlInput: { min: 0 } }}
            sx={{ width: { xs: 1, sm: 130 } }}
          />

          <TextField
            type="number"
            label={t('showcase.priceTo')}
            value={state.price_to}
            onChange={(e) => handleField('price_to', e.target.value)}
            slotProps={{ htmlInput: { min: 0 } }}
            sx={{ width: { xs: 1, sm: 130 } }}
          />

          <TextField
            value={state.city}
            onChange={(e) => handleField('city', e.target.value)}
            placeholder={t('showcase.city')}
            sx={{ width: { xs: 1, sm: 160 } }}
          />

          <TextField
            select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: 1, sm: 180 } }}
          >
            {SORT_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Stack>

      {classifiedsLoading ? (
        <LoadingScreen />
      ) : classifiedsEmpty || filtered.length === 0 ? (
        <EmptyContent filled title={t('showcase.empty')} sx={{ py: 10 }} />
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
