import { DEFAULT_ROLE, ROLE_PERMISSIONS, ROLES_LIST } from 'src/config/permissions';

import type { Role, Permission, ParsedPermission } from 'src/types/permissions';

// ----------------------------------------------------------------------

export function parsePermission(permission: string): ParsedPermission {
  if (permission === '*') return { resource: '*', isWildcard: true };
  const [resource, action] = permission.split(':');
  return { resource, action, isWildcard: false };
}

/**
 * Checks whether `granted` covers `required`.
 * Cascade: `rules` covers `rules:edit`, `*` covers everything.
 */
export function permissionCovers(granted: string, required: string): boolean {
  if (granted === '*') return true;
  if (granted === required) return true;

  const g = parsePermission(granted);
  const r = parsePermission(required);

  // `rules` (no action) covers `rules:edit`
  if (!g.action && g.resource === r.resource) return true;

  return false;
}

export function can(required: string, granted: readonly string[]): boolean {
  return granted.some((p) => permissionCovers(p, required));
}

export function canAny(required: readonly string[], granted: readonly string[]): boolean {
  return required.some((r) => can(r, granted));
}

export function canAll(required: readonly string[], granted: readonly string[]): boolean {
  return required.every((r) => can(r, granted));
}

export function getPermissionsForRole(
  role: Role,
  matrix: Record<Role, Permission[]> = ROLE_PERMISSIONS
): Permission[] {
  return matrix[role] ?? [];
}

export function normalizeRole(value: unknown): Role {
  return ROLES_LIST.includes(value as Role) ? (value as Role) : DEFAULT_ROLE;
}
