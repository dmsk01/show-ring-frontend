import type { NavItemDataProps } from 'src/components/nav-section';

// ----------------------------------------------------------------------

type CheckFn = (perm: string | string[], mode?: 'any' | 'all') => boolean;

export function filterNavItems(items: NavItemDataProps[], check: CheckFn): NavItemDataProps[] {
  return items
    .filter((item) => !item.permission || check(item.permission, item.permissionMode))
    .map((item) => ({
      ...item,
      children: item.children ? filterNavItems(item.children, check) : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0);
}
