'use client';

import type { AuthState } from '../../types';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import { normalizeRoles, getPermissionsForRoles } from 'src/utils/permissions';

import axios, { endpoints } from 'src/lib/axios';

import { AuthContext } from '../auth-context';

// ----------------------------------------------------------------------

type Props = { children: React.ReactNode };

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      // Cookie-режим: access-кука httpOnly (JS её не видит), поэтому просто
      // пробуем /users/me — браузер пришлёт куку сам. Если access протух, но
      // refresh-кука жива, response-интерсептор молча обновит сессию и повторит.
      // `_skipAuthRedirect`: для анонима (нет валидной сессии) 401 не должен
      // редиректить на логин — публичные страницы остаются доступными.
      const res = await axios.get(endpoints.auth.me, { _skipAuthRedirect: true });

      setState({ user: { ...res.data }, loading: false });
    } catch {
      setState({ user: null, loading: false });
    }
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
