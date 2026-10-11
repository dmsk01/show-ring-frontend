import type { IDogItem } from 'src/types/dog';

import { it, expect, describe } from 'vitest';

import { parentOptions, parentDogsQuery } from '../parent-options';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-07: родителей выбирали из первых 200 собак
// всей базы, без поиска и (в форме помёта) без фильтра по полу и породе.

const dog = (id: string, sex: 'male' | 'female' = 'male') =>
  ({ id, name: `Dog ${id}`, sex }) as IDogItem;

describe('parentDogsQuery', () => {
  it('searches the server by name and sex', () => {
    expect(parentDogsQuery({ search: 'рекс', sex: 'male' })).toEqual({
      search: 'рекс',
      sex: 'male',
      per_page: 50,
    });
  });

  it('narrows to the breed when one is given', () => {
    expect(parentDogsQuery({ search: '', sex: 'female', breedId: 'b1' })).toEqual({
      search: '',
      sex: 'female',
      breed_id: 'b1',
      per_page: 50,
    });
  });
});

describe('parentOptions', () => {
  it('drops the dog being edited', () => {
    expect(parentOptions([dog('a'), dog('self')], undefined, 'self')).toEqual([dog('a')]);
  });

  // Выбранный родитель может не попасть в результаты поиска: без него
  // Autocomplete не покажет подпись текущего значения.
  it('keeps the selected parent even when the search did not return it', () => {
    expect(parentOptions([dog('a')], dog('far'))).toEqual([dog('far'), dog('a')]);
  });

  it('does not duplicate the selected parent', () => {
    expect(parentOptions([dog('a'), dog('b')], dog('b'))).toEqual([dog('a'), dog('b')]);
  });
});
