'use client';

import type { AuthState } from '../../types';

import { useSetState } from 'minimal-shared/hooks';
import { useRef, useMemo, useEffect, useCallback } from 'react';

import { normalizeRoles, getPermissionsForRoles } from 'src/utils/permissions';

import axios, { endpoints } from 'src/lib/axios';

import { AuthContext } from '../auth-context';

// ----------------------------------------------------------------------

type Props = { children: React.ReactNode };

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  // Last resolved identity. `undefined` = not yet established (first load); after
  // that we hold the user id or `null` (anonymous) to detect identity changes.
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  const checkUserSession = useCallback(async () => {
    let nextUser: AuthState['user'] = null;
    try {
      // Cookie-режим: access-кука httpOnly (JS её не видит), поэтому просто
      // пробуем /users/me — браузер пришлёт куку сам. Если access протух, но
      // refresh-кука жива, response-интерсептор молча обновит сессию и повторит.
      // `_skipAuthRedirect`: для анонима (нет валидной сессии) 401 не должен
      // редиректить на логин — публичные страницы остаются доступными.
      const res = await axios.get(endpoints.auth.me, { _skipAuthRedirect: true });
      nextUser = { ...res.data };
    } catch {
      nextUser = null;
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
      window.location.reload();
      return;
    }

    setState({ user: nextUser, loading: false });
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    };
  }, [checkUserSession, state.user, status]);

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
