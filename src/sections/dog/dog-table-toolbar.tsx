'use client';

import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IDogTableFilters } from 'src/types/dog';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type BreedOption = { id: string; name: string };

type Props = {
  filters: UseSetStateReturn<IDogTableFilters>;
  onResetPage: () => void;
  breedOptions: BreedOption[];
};

export function DogTableToolbar({ filters, onResetPage, breedOptions }: Props) {
  const { t } = useTranslate(['dog', 'common']);
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ search: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleSex = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ sex: event.target.value as IDogTableFilters['sex'] });
    },
    [onResetPage, updateFilters]
  );

  const handleBreed = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ breed_id: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  return (
    <Box sx={{ p: 2.5, gap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        select
        label={t('list.filters.sex')}
        value={currentFilters.sex}
        onChange={handleSex}
        sx={{ width: { xs: 1, md: 160 } }}
      >
        <MenuItem value="all">{t('list.filters.all')}</MenuItem>
        <MenuItem value="male">{t('enums.sex.male')}</MenuItem>
        <MenuItem value="female">{t('enums.sex.female')}</MenuItem>
      </TextField>

      <TextField
        select
        label={t('list.filters.breed')}
        value={currentFilters.breed_id}
        onChange={handleBreed}
        sx={{ width: { xs: 1, md: 220 } }}
      >
        <MenuItem value="">{t('list.filters.all')}</MenuItem>
        {breedOptions.map((b) => (
          <MenuItem key={b.id} value={b.id}>
            {b.name}
          </MenuItem>
        ))}
      </TextField>

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
