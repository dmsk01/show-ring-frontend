import type { NavItemDataProps } from 'src/components/nav-section';

import { it, expect, describe } from 'vitest';

import { filterNavItems } from 'src/layouts/nav-filter';

// Permissions are pre-resolved here; we only assert the filtering behaviour.
const allow = () => true;
const deny = () => false;

const item = (overrides: Partial<NavItemDataProps>): NavItemDataProps => ({
  path: '/x',
  title: 'x',
  ...overrides,
});

describe('filterNavItems — feature flags', () => {
  it('drops an item whose flag is disabled', () => {
    const items = [item({ title: 'support', flag: 'support' }), item({ title: 'dogs' })];
    const result = filterNavItems(items, allow, (f) => f !== 'support');
    expect(result.map((i) => i.title)).toEqual(['dogs']);
  });

  it('keeps an item whose flag is enabled', () => {
    const items = [item({ title: 'support', flag: 'support' })];
    const result = filterNavItems(items, allow, () => true);
    expect(result.map((i) => i.title)).toEqual(['support']);
  });

  it('keeps flagged items when no flag predicate is supplied (backward compatible)', () => {
    const items = [item({ title: 'support', flag: 'support' })];
    expect(filterNavItems(items, allow)).toHaveLength(1);
  });

  it('combines permission and flag checks (both must pass)', () => {
    const items = [
      item({ title: 'allowed', permission: 'a', flag: 'on' }),
      item({ title: 'no-perm', permission: 'a' }),
      item({ title: 'flag-off', flag: 'off' }),
    ];
    const result = filterNavItems(items, deny, (f) => f === 'on');
    expect(result).toHaveLength(0);
  });

  it('filters flagged children recursively and prunes empty parents', () => {
    const items = [
      item({
        title: 'parent',
        children: [item({ title: 'child', flag: 'off' })],
      }),
    ];
    const result = filterNavItems(items, allow, () => false);
    expect(result).toHaveLength(0);
  });
});
