'use client';

import type { FeatureFlag } from 'src/config/feature-flags';

import { useRef, useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { SplashScreen } from 'src/components/loading-screen';

import { useFeatureFlags } from './use-feature-flags';

// ----------------------------------------------------------------------

type FeatureGuardProps = {
  flag: FeatureFlag;
  children: React.ReactNode;
};

export function FeatureGuard({ flag, children }: FeatureGuardProps) {
  const router = useRouter();
  const { loading, isEnabled } = useFeatureFlags();

  const [isChecking, setIsChecking] = useState(true);
  // Навигация на /404 должна случиться ровно один раз — эффект пере-срабатывает
  // на смену зависимостей (ср. PermissionGuard).
  const redirected = useRef(false);

  useEffect(() => {
    if (loading || redirected.current) return;

    // Disabled flag → the feature "does not exist" while off: redirect to 404.
    if (!isEnabled(flag)) {
      redirected.current = true;
      router.replace(paths.page404);
    } else {
      setIsChecking(false);
    }
  }, [loading, flag, isEnabled, router]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
