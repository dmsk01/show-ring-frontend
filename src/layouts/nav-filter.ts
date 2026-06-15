import type { NavItemDataProps } from 'src/components/nav-section';

// ----------------------------------------------------------------------

type CheckFn = (perm: string | string[], mode?: 'any' | 'all') => boolean;
type FlagFn = (flag: string) => boolean;

export function filterNavItems(
  items: NavItemDataProps[],
  check: CheckFn,
  flagEnabled?: FlagFn
): NavItemDataProps[] {
  return items
    .filter((item) => !item.permission || check(item.permission, item.permissionMode))
    .filter((item) => !item.flag || !flagEnabled || flagEnabled(item.flag))
    .map((item) => ({
      ...item,
      children: item.children ? filterNavItems(item.children, check, flagEnabled) : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0);
}
