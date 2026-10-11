// ----------------------------------------------------------------------

export type ProbeOptions = { afterLogout?: boolean };

/**
 * Кто вошёл, если проверка сессии (/users/me) упала. Анонимом считаем только
 * при 401: интерсептор уже попробовал refresh, и сессии нет. 5xx, обрыв сети
 * и временный сбой refresh (429/503) не значат «вышел» — оставляем текущего
 * пользователя, иначе AuthProvider перезагрузит страницу или AuthGuard
 * уведёт на вход посреди работы (ревью 2026-10-09, FE-03).
 */
export function userAfterProbeError<T>(
  error: unknown,
  currentUser: T | null,
  { afterLogout = false }: ProbeOptions = {}
): T | null {
  // Сразу после явного выхода бэкенд уже стёр обе куки: любая ошибка (в т.ч.
  // 429 на refresh без куки) значит «аноним», иначе UI остаётся «вошедшим».
  if (afterLogout) return null;
  const status = (error as { status?: number } | null)?.status;
  return status === 401 ? null : currentUser;
}

/** Временный сбой проверки сессии (не 401) — пользователь неизвестен. */
export function isTransientProbeError(error: unknown): boolean {
  return (error as { status?: number } | null)?.status !== 401;
}

/**
 * Что делать AuthGuard. Если первая проверка сессии упала временно (сеть,
 * 5xx, 429 на refresh), пользователь неизвестен: не уводим на вход, а
 * предлагаем повторить — сессия, скорее всего, жива (FE-03).
 */
export function authGuardDecision(state: {
  loading: boolean;
  authenticated: boolean;
  sessionUnknown: boolean;
}): 'wait' | 'render' | 'retry' | 'redirect' {
  if (state.loading) return 'wait';
  if (state.authenticated) return 'render';
  return state.sessionUnknown ? 'retry' : 'redirect';
}
