'use client';

import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IDogTableFilters } from 'src/types/dog';
import type { FiltersResultProps } from 'src/components/filters-result';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  filters: UseSetStateReturn<IDogTableFilters>;
};

export function DogTableFiltersResult({ filters, totalResults, sx }: Props) {
  const { t } = useTranslate(['dog', 'common']);
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleRemoveSearch = useCallback(() => {
    updateFilters({ search: '' });
  }, [updateFilters]);

  const handleRemoveSex = useCallback(() => {
    updateFilters({ sex: 'all' });
  }, [updateFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={() => resetFilters()} sx={sx}>
      <FiltersBlock label={`${t('list.filters.sex')}:`} isShow={currentFilters.sex !== 'all'}>
        <Chip
          {...chipProps}
          label={currentFilters.sex === 'female' ? t('enums.sex.female') : t('enums.sex.male')}
          onDelete={handleRemoveSex}
        />
      </FiltersBlock>

      <FiltersBlock label={`${t('common:actions.search')}:`} isShow={!!currentFilters.search}>
        <Chip {...chipProps} label={currentFilters.search} onDelete={handleRemoveSearch} />
      </FiltersBlock>
    </FiltersResult>
  );
}
