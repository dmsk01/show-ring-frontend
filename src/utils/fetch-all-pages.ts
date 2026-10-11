// ----------------------------------------------------------------------

export type Page<T> = { items: T[]; total: number; page?: number; per_page: number };

/** Максимальный размер страницы, который принимает бэкенд (`le=200`). */
export const MAX_PER_PAGE = 200;

/**
 * Собрать все записи постраничного списка. Справочники нельзя брать одной
 * страницей: пород FCI 362 при максимуме 200 на страницу (ревью 2026-10-09,
 * FE-07). Шаг берём из фактического `per_page` ответа — бэкенд урезает его
 * для анонима (cap_per_page). Голый массив (старый формат) отдаём как есть.
 * Пустая страница или `maxPages` останавливают цикл, даже если `total` врёт.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, perPage: number) => Promise<Page<T> | T[]>,
  { perPage = MAX_PER_PAGE, maxPages = 50 }: { perPage?: number; maxPages?: number } = {}
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const data = await fetchPage(page, perPage);
    if (Array.isArray(data)) return data;
    items.push(...data.items);
    if (data.items.length === 0 || items.length >= data.total) break;
  }
  return items;
}
