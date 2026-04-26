'use client';

import { usePermissions } from 'src/hooks/use-permissions';

import type { ReactNode } from 'react';
import type { Permission } from 'src/types/permissions';

// ----------------------------------------------------------------------

type Mode = 'any' | 'all';

export type CanProps = {
  permission: Permission | Permission[];
  mode?: Mode;
  fallback?: ReactNode;
  children: ReactNode | ((ctx: { allowed: boolean }) => ReactNode);
};

export function Can({ permission, mode = 'any', fallback = null, children }: CanProps) {
  const { can, canAny, canAll } = usePermissions();

  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed =
    perms.length === 1 ? can(perms[0]) : mode === 'all' ? canAll(perms) : canAny(perms);

  if (typeof children === 'function') return <>{children({ allowed })}</>;
  return <>{allowed ? children : fallback}</>;
}
