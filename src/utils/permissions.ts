import type { Role, Permission, ParsedPermission } from 'src/types/permissions';

import { ROLES_LIST, DEFAULT_ROLE, ROLE_PERMISSIONS } from 'src/config/permissions';

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

// ----------------------------------------------------------------------

type ApiRole = string | { role?: string };

/** Maps `/users/me` roles ([{role}]) or bare strings to known Role[]; falls back to [DEFAULT_ROLE]. */
export function normalizeRoles(value: readonly ApiRole[] | null | undefined): Role[] {
  const raw = (value ?? [])
    .map((r) => (typeof r === 'string' ? r : r?.role))
    .filter((r): r is string => Boolean(r));

  const known = raw.filter((r): r is Role => ROLES_LIST.includes(r as Role));

  return known.length ? known : [DEFAULT_ROLE];
}

/** Union (deduped) of permissions across all given roles. */
export function getPermissionsForRoles(
  roles: readonly Role[],
  matrix: Record<Role, Permission[]> = ROLE_PERMISSIONS
): Permission[] {
  const set = new Set<Permission>();
  roles.forEach((role) => (matrix[role] ?? []).forEach((p) => set.add(p)));
  return [...set];
}
