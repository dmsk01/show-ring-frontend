import type { Role, Permission } from 'src/types/permissions';

// ----------------------------------------------------------------------

export const DEFAULT_ROLE: Role = 'buyer';

export const ROLES_LIST: Role[] = ['admin', 'organizer', 'breeder', 'judge', 'buyer', 'operator'];

// Стартовая матрица прав. Расширяется по мере добавления доменов.
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['*'],
  organizer: ['dashboard:view', 'shows', 'results', 'references:view', 'ads'],
  breeder: ['dashboard:view', 'dogs', 'kennels', 'litters', 'classifieds', 'shows:view', 'references:view'],
  judge: ['dashboard:view', 'shows:view', 'results:create', 'results:edit', 'references:view'],
  buyer: ['dashboard:view', 'classifieds:view', 'dogs:view', 'references:view'],
  operator: ['dashboard:view', 'support', 'classifieds:view', 'references:view'],
};
