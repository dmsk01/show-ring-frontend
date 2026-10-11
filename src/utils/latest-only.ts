// ----------------------------------------------------------------------

export type LatestResult<T> = { ok: true; value: T } | { ok: false };

/**
 * Обёртка для поиска «по мере ввода»: результат запроса отдаётся, только если
 * после него не стартовал более новый. Иначе медленный ответ на «Ива» затрёт
 * быстрый ответ на «Иван» (ревью 2026-10-09, FE-21). Ошибки — тоже только
 * для последнего запроса.
 */
export function latestOnly() {
  let latest = 0;
  return async function run<T>(request: () => Promise<T>): Promise<LatestResult<T>> {
    latest += 1;
    const id = latest;
    try {
      const value = await request();
      return id === latest ? { ok: true, value } : { ok: false };
    } catch (error) {
      if (id === latest) throw error;
      return { ok: false };
    }
  };
}
