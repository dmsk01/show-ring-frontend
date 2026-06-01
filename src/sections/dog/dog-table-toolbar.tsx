import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IDogTableFilters } from 'src/types/dog';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type BreedOption = { id: string; name: string };

type Props = {
  filters: UseSetStateReturn<IDogTableFilters>;
  onResetPage: () => void;
  breedOptions: BreedOption[];
};

export function DogTableToolbar({ filters, onResetPage, breedOptions }: Props) {
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
        label="Sex"
        value={currentFilters.sex}
        onChange={handleSex}
        sx={{ width: { xs: 1, md: 160 } }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="male">Male</MenuItem>
        <MenuItem value="female">Female</MenuItem>
      </TextField>

      <TextField
        select
        label="Breed"
        value={currentFilters.breed_id}
        onChange={handleBreed}
        sx={{ width: { xs: 1, md: 220 } }}
      >
        <MenuItem value="">All</MenuItem>
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
        placeholder="Search dogs..."
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
