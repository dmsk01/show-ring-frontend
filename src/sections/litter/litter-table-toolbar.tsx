import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { ILitterTableFilters } from 'src/types/litter';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { LITTER_STATUSES } from 'src/types/litter';

// ----------------------------------------------------------------------

type BreedOption = { id: string; name: string };

type Props = {
  filters: UseSetStateReturn<ILitterTableFilters>;
  onResetPage: () => void;
  breedOptions: BreedOption[];
};

export function LitterTableToolbar({ filters, onResetPage, breedOptions }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleStatus = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ status: event.target.value as ILitterTableFilters['status'] });
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
        label="Status"
        value={currentFilters.status}
        onChange={handleStatus}
        sx={{ width: { xs: 1, md: 180 } }}
      >
        <MenuItem value="all">All</MenuItem>
        {LITTER_STATUSES.map((status) => (
          <MenuItem key={status} value={status}>
            {status}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Breed"
        value={currentFilters.breed_id}
        onChange={handleBreed}
        sx={{ width: { xs: 1, md: 240 } }}
      >
        <MenuItem value="">All</MenuItem>
        {breedOptions.map((breed) => (
          <MenuItem key={breed.id} value={breed.id}>
            {breed.name}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
