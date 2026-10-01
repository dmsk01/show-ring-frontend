'use client';

import { useState, useEffect } from 'react';

import { useRouter, useSearchParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';
import { safeReturnTo } from '../view/jwt/phone-verified';

// ----------------------------------------------------------------------

type GuestGuardProps = {
  children: React.ReactNode;
};

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { loading, authenticated } = useAuthContext();

  // Только внутренний путь — иначе ?returnTo=https://evil… даёт open redirect.
  const returnTo = safeReturnTo(searchParams.get('returnTo')) ?? CONFIG.auth.redirectPath;

  const [isChecking, setIsChecking] = useState(true);

  const checkPermissions = async (): Promise<void> => {
    if (loading) {
      return;
    }

    if (authenticated) {
      router.replace(returnTo);
      return;
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, loading]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
