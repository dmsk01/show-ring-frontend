'use client';

import type { AuthState } from '../../types';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import { normalizeRoles, getPermissionsForRoles } from 'src/utils/permissions';

import axios, { endpoints } from 'src/lib/axios';

import { setSession } from './utils';
import { JWT_STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';

// ----------------------------------------------------------------------

type Props = { children: React.ReactNode };

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem(JWT_STORAGE_KEY);

      if (!accessToken) {
        setState({ user: null, loading: false });
        return;
      }

      setSession(accessToken);
      // /users/me; if access token is expired the response interceptor refreshes once.
      const res = await axios.get(endpoints.auth.me);
      const user = res.data;

      setState({ user: { ...user, accessToken }, loading: false });
    } catch (error) {
      console.error(error);
      setSession(null);
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
