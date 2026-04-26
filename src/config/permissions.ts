import type { Role, Permission } from 'src/types/permissions';

// ----------------------------------------------------------------------

export const DEFAULT_ROLE: Role = 'user';

export const ROLES_LIST: Role[] = ['admin', 'user'];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['*'],
  user: ['dashboard:view', 'reports:view'],
};
