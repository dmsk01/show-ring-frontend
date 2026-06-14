'use client';

import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IShowFilters } from 'src/types/show';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { SHOW_STATUSES } from 'src/types/show';

import { showStatusI18nKey } from './show-utils';

// ----------------------------------------------------------------------

type Props = {
  filters: UseSetStateReturn<IShowFilters>;
  onResetPage: () => void;
};

export function ShowTableToolbar({ filters, onResetPage }: Props) {
  const { t } = useTranslate('show');
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleStatus = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ status: event.target.value as IShowFilters['status'] });
    },
    [onResetPage, updateFilters]
  );

  const handleCity = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ city: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ search: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  return (
    <Box sx={{ p: 2.5, gap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        select
        label={t('list.filters.status')}
        value={currentFilters.status}
        onChange={handleStatus}
        sx={{ width: { xs: 1, md: 220 } }}
      >
        <MenuItem value="all">{t('list.filters.all')}</MenuItem>
        {SHOW_STATUSES.map((s) => (
          <MenuItem key={s} value={s}>
            {t(showStatusI18nKey(s))}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        value={currentFilters.city}
        onChange={handleCity}
        placeholder={t('list.filters.city')}
        sx={{ width: { xs: 1, md: 200 } }}
      />

      <TextField
        fullWidth
        value={currentFilters.search}
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
        sx={{ flex: 1, minWidth: 200 }}
      />
    </Box>
  );
}
