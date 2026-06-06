'use client';

import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IKennelTableFilters } from 'src/types/kennel';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: UseSetStateReturn<IKennelTableFilters>;
  onResetPage: () => void;
};

export function KennelTableToolbar({ filters, onResetPage }: Props) {
  const { t } = useTranslate(['kennel', 'common']);
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ search: event.target.value });
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

  return (
    <Box sx={{ p: 2.5, gap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        value={currentFilters.city}
        onChange={handleCity}
        placeholder={t('form.filterCity')}
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
