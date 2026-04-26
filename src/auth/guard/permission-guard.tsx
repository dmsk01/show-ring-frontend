'use client';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { SplashScreen } from 'src/components/loading-screen';

import { usePermissions } from 'src/hooks/use-permissions';
import { useAuthContext } from '../hooks';

import type { Permission } from 'src/types/permissions';

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

  useEffect(() => {
    if (loading) return;

    const perms = Array.isArray(permission) ? permission : [permission];
    const allowed =
      perms.length === 1 ? can(perms[0]) : mode === 'all' ? canAll(perms) : canAny(perms);

    if (!allowed) {
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
