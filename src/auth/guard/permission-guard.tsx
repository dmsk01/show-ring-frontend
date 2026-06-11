'use client';

import type { Permission } from 'src/types/permissions';

import { useRef, useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { usePermissions } from 'src/hooks/use-permissions';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

type PermissionGuardProps = {
  permission: Permission | Permission[];
  mode?: 'any' | 'all';
  children: React.ReactNode;
};

export function PermissionGuard({ permission, mode = 'any', children }: PermissionGuardProps) {
  const router = useRouter();
  const { loading } = useAuthContext();
  const { can, canAny, canAll } = usePermissions();

  const [isChecking, setIsChecking] = useState(true);
  // Гард от повторного router.replace: эффект пере-срабатывает на смену любых
  // зависимостей, а навигация на /403 должна случиться ровно один раз.
  const redirected = useRef(false);

  useEffect(() => {
    if (loading || redirected.current) return;

    const perms = Array.isArray(permission) ? permission : [permission];
    const allowed =
      perms.length === 1 ? can(perms[0]) : mode === 'all' ? canAll(perms) : canAny(perms);

    if (!allowed) {
      redirected.current = true;
      router.replace(paths.page403);
    } else {
      setIsChecking(false);
    }
  }, [loading, permission, mode, can, canAny, canAll, router]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
