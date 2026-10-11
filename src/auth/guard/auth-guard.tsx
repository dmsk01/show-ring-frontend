'use client';

import { useState, useEffect } from 'react';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter, usePathname } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { EmptyContent } from 'src/components/empty-content';
import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';
import { signInRedirectPath } from './sign-in-redirect';
import { authGuardDecision } from '../context/jwt/session-probe';

// ----------------------------------------------------------------------

type AuthGuardProps = {
  children: React.ReactNode;
};

const signInPaths = {
  jwt: paths.auth.jwt.signIn,
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { t } = useTranslate('common');
  const { authenticated, loading, sessionUnknown, checkUserSession } = useAuthContext();
  const decision = authGuardDecision({ loading, authenticated, sessionUnknown });

  const [isChecking, setIsChecking] = useState(true);

  const createRedirectPath = (currentPath: string) =>
    signInRedirectPath(currentPath, pathname, window.location.search);

  // Проверяет только аутентификацию (есть ли сессия). Права на конкретные
  // ресурсы проверяет отдельный PermissionGuard.
  const checkAuth = async (): Promise<void> => {
    if (decision === 'wait' || decision === 'retry') {
      return;
    }

    if (decision === 'redirect') {
      const { method } = CONFIG.auth;

      const signInPath = signInPaths[method];
      const redirectPath = createRedirectPath(signInPath);

      router.replace(redirectPath);

      return;
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision]);

  // Проверка сессии упала временно (сеть, 5xx, лимит refresh) — не уводим
  // на вход: сессия, скорее всего, жива (ревью 2026-10-09, FE-03).
  if (decision === 'retry') {
    return (
      <EmptyContent
        filled
        title={t('errors.network')}
        action={
          <Button variant="contained" sx={{ mt: 3 }} onClick={() => checkUserSession?.()}>
            {t('actions.retry')}
          </Button>
        }
        sx={{ m: 3, py: 10 }}
      />
    );
  }

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
