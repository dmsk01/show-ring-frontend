'use client';

import type { AuthState } from '../../types';
import type { ProbeOptions } from './session-probe';

import { useSetState } from 'minimal-shared/hooks';
import { useRef, useMemo, useEffect, useCallback } from 'react';

import { normalizeRoles, getPermissionsForRoles } from 'src/utils/permissions';

import axios, { endpoints } from 'src/lib/axios';

import { AuthContext } from '../auth-context';
import { onAuthChanged, notifyAuthChanged } from './auth-channel';
import { userAfterProbeError, isTransientProbeError } from './session-probe';

// ----------------------------------------------------------------------

type Props = { children: React.ReactNode };

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  // Last resolved identity. `undefined` = not yet established (first load); after
  // that we hold the user id or `null` (anonymous) to detect identity changes.
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  // Текущий пользователь для checkUserSession (useCallback без зависимостей
  // от state иначе видел бы устаревшее значение).
  const userRef = useRef<AuthState['user']>(null);
  userRef.current = state.user;

  const checkUserSession = useCallback(
    async (options?: ProbeOptions) => {
      let nextUser: AuthState['user'] = null;
      let sessionUnknown = false;
      try {
        // Cookie-режим: access-кука httpOnly (JS её не видит), поэтому просто
        // пробуем /users/me — браузер пришлёт куку сам. Если access протух, но
        // refresh-кука жива, response-интерсептор молча обновит сессию и повторит.
        // `_skipAuthRedirect`: для анонима (нет валидной сессии) 401 не должен
        // редиректить на логин — публичные страницы остаются доступными.
        const res = await axios.get(endpoints.auth.me, { _skipAuthRedirect: true });
        nextUser = { ...res.data };
      } catch (error) {
        // 401 — аноним; 5xx/сеть/временный сбой refresh — оставляем как было.
        nextUser = userAfterProbeError(error, userRef.current, options);
        sessionUnknown = !nextUser && !options?.afterLogout && isTransientProbeError(error);
      }

      const nextUserId = (nextUser?.id as string | undefined) ?? null;
      const prevUserId = prevUserIdRef.current;
      prevUserIdRef.current = nextUserId;

      // Identity changed within a live SPA session (login / logout / account switch /
      // revoked session) → force a FULL reload. The sign-in/out handlers only call
      // router.refresh(), which re-renders Server Components but keeps SWR's
      // in-memory cache. Without a hard reset the next identity would both inherit
      // the previous user's auth-scoped data (e.g. /classifieds/mine) AND fail to
      // load its own until a manual reload. Reloading reinitializes the JS context,
      // guaranteeing a clean, correct per-user state. Skip the first establishment
      // (prev === undefined): the cache is empty and a fresh page load is in flight.
      if (prevUserId !== undefined && prevUserId !== nextUserId && typeof window !== 'undefined') {
        // Другие вкладки тоже перепроверят сессию (FE-05).
        notifyAuthChanged(nextUserId ? 'login' : 'logout');
        window.location.reload();
        return;
      }

      setState({ user: nextUser, loading: false, sessionUnknown });
    },
    [setState]
  );

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Вход/выход в другой вкладке: перепроверяем сессию здесь. После выхода
  // куки уже стёрты — любая ошибка проверки значит «аноним» (FE-05).
  useEffect(
    () =>
      onAuthChanged((event) => {
        checkUserSession(event === 'logout' ? { afterLogout: true } : undefined);
      }),
    [checkUserSession]
  );

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';
  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(() => {
    const roles = normalizeRoles(state.user?.roles);
    const permissions = state.user ? getPermissionsForRoles(roles) : [];

    return {
      user: state.user,
      roles: state.user ? roles : [],
      permissions,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      sessionUnknown: !state.user && !!state.sessionUnknown,
    };
  }, [checkUserSession, state.user, state.sessionUnknown, status]);

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
