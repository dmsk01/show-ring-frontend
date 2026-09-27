import type { SWRConfiguration } from 'swr';
import type {
  IDogPage,
  IDogItem,
  IDogTitle,
  IDogCreate,
  IDogUpdate,
  IDogSibling,
  IPedigreeNode,
  IDogDescendant,
  IDogImageCreate,
} from 'src/types/dog';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export type DogsQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  breed_id?: string;
  kennel_id?: string;
  litter_id?: string;
  sex?: string;
  sort_by?: 'name' | 'date_of_birth' | 'created_at';
  order?: 'asc' | 'desc';
};

// ----------------------------------------------------------------------

export function useGetDogs(query: DogsQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all')
  );
  const key: [string, { params: Record<string, unknown> }] = [endpoints.dog.list, { params }];

  const { data, isLoading, error, isValidating } = useSWR<IDogPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      dogs: data?.items ?? [],
      dogsTotal: data?.total ?? 0,
      dogsLoading: isLoading,
      dogsError: error,
      dogsValidating: isValidating,
      dogsEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

/** Собаки текущего пользователя (owner_id == me). Требует авторизации. */
export function useGetMyDogs(query: { page?: number; per_page?: number } = {}) {
  const params = Object.fromEntries(
    // Только undefined: оба поля числовые, строковые гарды (''/'all') из
    // useGetDogs тут не тайпчекаются — добавить при появлении строковых полей.
    Object.entries(query).filter(([, v]) => v !== undefined)
  );
  const key: [string, { params: Record<string, unknown> }] = [endpoints.auth.myDogs, { params }];

  const { data, isLoading, error, isValidating } = useSWR<IDogPage>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      dogs: data?.items ?? [],
      dogsTotal: data?.total ?? 0,
      dogsLoading: isLoading,
      dogsError: error,
      dogsEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export function useGetDog(dogId?: string) {
  const key = dogId ? endpoints.dog.details(dogId) : null;

  const { data, isLoading, error, isValidating } = useSWR<IDogItem>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ dog: data, dogLoading: isLoading, dogError: error, dogValidating: isValidating }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export function useGetDogTitles(dogId?: string) {
  const key = dogId ? endpoints.dog.titles(dogId) : null;

  const { data, isLoading, error } = useSWR<IDogTitle[]>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ titles: data ?? [], titlesLoading: isLoading, titlesError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

export function useGetDogPedigree(dogId?: string) {
  const key = dogId ? endpoints.dog.pedigree(dogId) : null;

  const { data, isLoading, error } = useSWR<IPedigreeNode>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ pedigree: data, pedigreeLoading: isLoading, pedigreeError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

/** Прямые потомки собаки (выводятся из father_id/mother_id на бэкенде). */
export function useGetDogDescendants(dogId?: string) {
  const key = dogId ? endpoints.dog.descendants(dogId) : null;

  const { data, isLoading, error } = useSWR<IDogDescendant[]>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ descendants: data ?? [], descendantsLoading: isLoading, descendantsError: error }),
    [data, error, isLoading]
  );
}

/** Сибсы собаки: полнородные (оба родителя общие) и полукровные. */
export function useGetDogSiblings(dogId?: string) {
  const key = dogId ? endpoints.dog.siblings(dogId) : null;

  const { data, isLoading, error } = useSWR<IDogSibling[]>(key, fetcher, swrOptions);

  return useMemo(
    () => ({ siblings: data ?? [], siblingsLoading: isLoading, siblingsError: error }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

/**
 * Смена родителя у собаки меняет родство сразу у многих карточек (потомки
 * родителя, сибсы потомка и его новых/бывших братьев) — точечно их не
 * вычислить, поэтому сбрасываем все кэши потомков/сибсов/родословных.
 */
async function mutateDogRelatives() {
  await mutate(
    (key) =>
      typeof key === 'string' &&
      key.startsWith('/dogs/') &&
      /\/(descendants|siblings|pedigree)$/.test(key)
  );
}

/** Сделать существующую собаку потомком: бэкенд ставит её father_id/mother_id. */
export async function addDogDescendant(dogId: string, childId: string): Promise<IDogDescendant> {
  const res = await axios.post<IDogDescendant>(endpoints.dog.descendants(dogId), {
    child_id: childId,
  });
  await mutate(endpoints.dog.details(childId));
  await mutateDogRelatives();
  return res.data;
}

/** Убрать потомка: очищает у него ссылку на эту собаку (сам потомок остаётся). */
export async function removeDogDescendant(dogId: string, childId: string): Promise<void> {
  await axios.delete(endpoints.dog.descendant(dogId, childId));
  await mutate(endpoints.dog.details(childId));
  await mutateDogRelatives();
}

// ----------------------------------------------------------------------

/** Инвалидация списочных SWR-кэшей собак: общий каталог + «Мои собаки». */
async function mutateDogLists() {
  await mutate(
    (key) =>
      Array.isArray(key) && (key[0] === endpoints.dog.list || key[0] === endpoints.auth.myDogs)
  );
}

export async function createDog(payload: IDogCreate): Promise<IDogItem> {
  const res = await axios.post<IDogItem>(endpoints.dog.list, payload);
  await mutateDogLists();
  return res.data;
}

export async function updateDog(dogId: string, payload: IDogUpdate): Promise<IDogItem> {
  const res = await axios.put<IDogItem>(endpoints.dog.details(dogId), payload);
  await mutate(endpoints.dog.details(dogId));
  await mutateDogLists();
  if ('father_id' in payload || 'mother_id' in payload) await mutateDogRelatives();
  return res.data;
}

/** Attach already-uploaded files (file_id from uploadFile) to a dog. */
export async function addDogImages(
  dogId: string,
  images: IDogImageCreate[]
): Promise<IDogItem> {
  const res = await axios.post<IDogItem>(endpoints.dog.images(dogId), images);
  await mutate(endpoints.dog.details(dogId));
  await mutateDogLists();
  return res.data;
}

/** Detach a photo (dog↔file link) from a dog. Backend: DELETE /dogs/{id}/images/{file_id}. */
export async function deleteDogImage(dogId: string, fileId: string): Promise<IDogItem> {
  // Backend returns the updated dog — seed the detail cache from it (no extra GET).
  const res = await axios.delete<IDogItem>(endpoints.dog.image(dogId, fileId));
  await mutate(endpoints.dog.details(dogId), res.data, { revalidate: false });
  await mutateDogLists();
  return res.data;
}
