import type { Role, Permission } from 'src/types/permissions';

// ----------------------------------------------------------------------

export const DEFAULT_ROLE: Role = 'buyer';

export const ROLES_LIST: Role[] = ['admin', 'organizer', 'breeder', 'judge', 'buyer', 'operator'];

// Стартовая матрица прав. Расширяется по мере добавления доменов.
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['*'],
  organizer: ['dashboard:view', 'shows', 'results', 'references:view', 'ads', 'kennels:view', 'litters:view', 'classifieds:view', 'support:view', 'support:create'],
  breeder: ['dashboard:view', 'dogs', 'kennels', 'litters', 'classifieds', 'shows:view', 'references:view', 'support:view', 'support:create'],
  judge: ['dashboard:view', 'shows:view', 'results:create', 'results:edit', 'references:view', 'kennels:view', 'litters:view', 'classifieds:view', 'support:view', 'support:create'],
  buyer: ['dashboard:view', 'classifieds:view', 'dogs:view', 'references:view', 'kennels:view', 'litters:view', 'shows:view', 'support:view', 'support:create'],
  operator: ['dashboard:view', 'support', 'classifieds:view', 'references:view', 'kennels:view', 'litters:view', 'shows:view'],
};
