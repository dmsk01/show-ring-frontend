'use client';

import { useMemo } from 'react';
import { useAuthContext } from 'src/auth/hooks';
import { can, canAny, canAll } from 'src/utils/permissions';

import type { Permission } from 'src/types/permissions';

// ----------------------------------------------------------------------

export function usePermissions() {
  const { user, permissions } = useAuthContext();

  return useMemo(
    () => ({
      role: user?.role,
      permissions,
      can: (perm: Permission | string) => can(perm, permissions),
      canAny: (perms: readonly (Permission | string)[]) => canAny(perms, permissions),
      canAll: (perms: readonly (Permission | string)[]) => canAll(perms, permissions),
    }),
    [user?.role, permissions]
  );
}
