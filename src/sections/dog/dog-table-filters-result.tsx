import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IDogTableFilters } from 'src/types/dog';
import type { FiltersResultProps } from 'src/components/filters-result';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  filters: UseSetStateReturn<IDogTableFilters>;
};

export function DogTableFiltersResult({ filters, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleRemoveSearch = useCallback(() => {
    updateFilters({ search: '' });
  }, [updateFilters]);

  const handleRemoveSex = useCallback(() => {
    updateFilters({ sex: 'all' });
  }, [updateFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={() => resetFilters()} sx={sx}>
      <FiltersBlock label="Sex:" isShow={currentFilters.sex !== 'all'}>
        <Chip {...chipProps} label={currentFilters.sex} onDelete={handleRemoveSex} />
      </FiltersBlock>

      <FiltersBlock label="Search:" isShow={!!currentFilters.search}>
        <Chip {...chipProps} label={currentFilters.search} onDelete={handleRemoveSearch} />
      </FiltersBlock>
    </FiltersResult>
  );
}
