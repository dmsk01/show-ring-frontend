import { it, expect, describe } from 'vitest';

import { normalizeRoles, getPermissionsForRoles } from 'src/utils/permissions';

describe('multi-role resolution', () => {
  it('normalizes API role objects to a Role[]', () => {
    expect(normalizeRoles([{ role: 'admin' }, { role: 'breeder' }])).toEqual(['admin', 'breeder']);
  });

  it('drops unknown roles', () => {
    expect(normalizeRoles([{ role: 'wizard' }, { role: 'judge' }])).toEqual(['judge']);
  });

  it('falls back to the default role when empty', () => {
    expect(normalizeRoles([])).toEqual(['buyer']);
  });

  it('accepts bare string roles too', () => {
    expect(normalizeRoles(['organizer'])).toEqual(['organizer']);
  });

  it('unions and dedupes permissions across roles', () => {
    const perms = getPermissionsForRoles(['breeder', 'judge']);
    expect(perms).toContain('dogs'); // breeder
    expect(perms).toContain('documents'); // judge
    expect(perms.filter((p) => p === 'dashboard:view')).toHaveLength(1);
  });
});
