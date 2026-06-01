'use client';

import type { Permission } from 'src/types/permissions';

import { useMemo } from 'react';

import { can, canAny, canAll } from 'src/utils/permissions';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function usePermissions() {
  const { roles, permissions } = useAuthContext();

  return useMemo(
    () => ({
      roles,
      permissions,
      can: (perm: Permission | string) => can(perm, permissions),
      canAny: (perms: readonly (Permission | string)[]) => canAny(perms, permissions),
      canAll: (perms: readonly (Permission | string)[]) => canAll(perms, permissions),
    }),
    [roles, permissions]
  );
}
