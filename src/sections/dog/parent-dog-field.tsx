'use client';

import type { IDogItem } from 'src/types/dog';

import { useState } from 'react';
import { useDebounce } from 'minimal-shared/hooks';
import { Controller, useFormContext } from 'react-hook-form';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import { useTranslate } from 'src/locales';
import { useGetDog, useGetDogs } from 'src/actions/dog';

import { parentOptions, parentDogsQuery } from './parent-options';

// ----------------------------------------------------------------------

type Props = {
  name: 'father_id' | 'mother_id';
  label: string;
  /** Собака, которую правим: сама себе не родитель. */
  excludeId?: string;
  /** Для помёта бэкенд требует ту же породу у родителей. */
  breedId?: string;
  disabled?: boolean;
};

/**
 * Выбор отца/матери с серверным поиском по кличке (FE-07). Значение в форме —
 * id или ''. Выбранного родителя догружаем по id, поэтому он виден и сохраняется,
 * даже если не попал в результаты поиска.
 */
export function ParentDogField({ name, label, excludeId, breedId, disabled }: Props) {
  const { t } = useTranslate('dog');
  const { control } = useFormContext();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const sex = name === 'father_id' ? 'male' : 'female';
  const { dogs, dogsLoading } = useGetDogs(
    parentDogsQuery({ search: debouncedSearch, sex, breedId })
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <ParentAutocomplete
          value={field.value || ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          found={dogs}
          loading={dogsLoading}
          excludeId={excludeId}
          label={label}
          disabled={disabled}
          error={error?.message}
          noOptionsText={t('relatives.noOptions')}
          placeholder={t('form.parentSearch')}
          onSearch={setSearch}
        />
      )}
    />
  );
}

// ----------------------------------------------------------------------

type AutocompleteProps = {
  value: string;
  onChange: (id: string) => void;
  onBlur: () => void;
  found: IDogItem[];
  loading: boolean;
  excludeId?: string;
  label: string;
  disabled?: boolean;
  error?: string;
  noOptionsText: string;
  placeholder: string;
  onSearch: (search: string) => void;
};

function ParentAutocomplete({
  value,
  onChange,
  onBlur,
  found,
  loading,
  excludeId,
  label,
  disabled,
  error,
  noOptionsText,
  placeholder,
  onSearch,
}: AutocompleteProps) {
  // Только что выбранную собаку держим локально, чтобы подпись не мигала,
  // пока карточка по id грузится; сохранённого родителя — догружаем.
  const [picked, setPicked] = useState<IDogItem | null>(null);
  const { dog: fetched } = useGetDog(value && picked?.id !== value ? value : undefined);
  const selected = picked?.id === value ? picked : fetched?.id === value ? fetched : undefined;
  const options = parentOptions(found, selected, excludeId);

  return (
    <Autocomplete
      value={selected ?? null}
      options={options}
      loading={loading}
      disabled={disabled}
      // Фильтрация на сервере — клиентская бы прятала найденное бэкендом.
      filterOptions={(x) => x}
      onChange={(_e, dog) => {
        setPicked(dog);
        onChange(dog?.id ?? '');
      }}
      onBlur={onBlur}
      onInputChange={(_e, input, reason) => {
        if (reason === 'input') onSearch(input);
        if (reason === 'clear') onSearch('');
      }}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, v) => option.id === v.id}
      noOptionsText={noOptionsText}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={!!error}
          helperText={error}
        />
      )}
    />
  );
}
