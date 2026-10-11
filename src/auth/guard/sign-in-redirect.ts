// ----------------------------------------------------------------------

/**
 * Путь на страницу входа с возвратом на текущую страницу ВМЕСТЕ с
 * query-строкой (вкладки, фильтры, страница списка) — ревью 2026-10-09, FE-06.
 */
export function signInRedirectPath(signInPath: string, pathname: string, search: string): string {
  const returnTo = `${pathname}${search}`;
  return `${signInPath}?${new URLSearchParams({ returnTo }).toString()}`;
}
