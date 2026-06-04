import { it, expect, describe } from 'vitest';

import { can, getPermissionsForRole } from 'src/utils/permissions';

import { ROLES_LIST, DEFAULT_ROLE, ROLE_PERMISSIONS } from 'src/config/permissions';

describe('RBAC config', () => {
  it('lists the 6 backend roles', () => {
    expect([...ROLES_LIST].sort()).toEqual(
      ['admin', 'breeder', 'buyer', 'judge', 'operator', 'organizer'].sort()
    );
  });

  it('defaults to the least-privileged role', () => {
    expect(DEFAULT_ROLE).toBe('buyer');
  });

  it('grants admin the wildcard', () => {
    expect(ROLE_PERMISSIONS.admin).toContain('*');
  });

  it('lets breeders manage dogs but not shows', () => {
    expect(ROLE_PERMISSIONS.breeder).toContain('dogs');
    expect(ROLE_PERMISSIONS.breeder).not.toContain('shows');
  });
});

describe('documents permission', () => {
  it('organizer and judge can create documents', () => {
    expect(can('documents:create', getPermissionsForRole('organizer'))).toBe(true);
    expect(can('documents:create', getPermissionsForRole('judge'))).toBe(true);
  });
  it('admin (wildcard) can create documents', () => {
    expect(can('documents:create', getPermissionsForRole('admin'))).toBe(true);
  });
  it('buyer and breeder cannot create documents', () => {
    expect(can('documents:create', getPermissionsForRole('buyer'))).toBe(false);
    expect(can('documents:create', getPermissionsForRole('breeder'))).toBe(false);
  });
});
