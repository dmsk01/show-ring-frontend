import type { IDogItem } from 'src/types/dog';
import type { DogsQuery } from 'src/actions/dog';

// ----------------------------------------------------------------------

/**
 * Запрос кандидатов в родители: серверный поиск по кличке с фильтром пола
 * (и породы для помёта — её сверяет бэкенд). Раньше брали первые 200 собак
 * всей базы (ревью 2026-10-09, FE-07).
 */
export function parentDogsQuery({
  search,
  sex,
  breedId,
}: {
  search: string;
  sex: 'male' | 'female';
  breedId?: string;
}): DogsQuery {
  return { search, sex, ...(breedId ? { breed_id: breedId } : {}), per_page: 50 };
}

/** Варианты выбора: найденное без самой собаки, плюс текущий выбранный родитель. */
export function parentOptions(
  found: IDogItem[],
  selected: IDogItem | undefined,
  excludeId?: string
): IDogItem[] {
  const options = found.filter((d) => d.id !== excludeId);
  if (selected && !options.some((d) => d.id === selected.id)) return [selected, ...options];
  return options;
}
