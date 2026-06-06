'use client';

import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IClassifiedFilters } from 'src/types/classified';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { useTranslate } from 'src/locales';

import { CLASSIFIED_CATEGORIES } from 'src/types/classified';

import { classifiedCategoryI18nKey } from './classified-utils';

// ----------------------------------------------------------------------

type Props = {
  filters: UseSetStateReturn<IClassifiedFilters>;
  onResetPage: () => void;
};

export function ClassifiedTableToolbar({ filters, onResetPage }: Props) {
  const { t } = useTranslate(['classified', 'common']);
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleCategory = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ category: event.target.value as IClassifiedFilters['category'] });
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
        select
        label={t('list.filters.category')}
        value={currentFilters.category}
        onChange={handleCategory}
        sx={{ width: { xs: 1, md: 220 } }}
      >
        <MenuItem value="all">{t('list.filters.all')}</MenuItem>
        {CLASSIFIED_CATEGORIES.map((cat) => (
          <MenuItem key={cat} value={cat}>
            {t(classifiedCategoryI18nKey(cat))}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        value={currentFilters.city}
        onChange={handleCity}
        placeholder={t('list.filters.city')}
        sx={{ width: { xs: 1, md: 200 } }}
      />
    </Box>
  );
}
