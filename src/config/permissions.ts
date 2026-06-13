import type { Role, Permission } from 'src/types/permissions';

// ----------------------------------------------------------------------

export const DEFAULT_ROLE: Role = 'buyer';

export const ROLES_LIST: Role[] = ['admin', 'organizer', 'breeder', 'judge', 'buyer', 'operator'];

// Стартовая матрица прав. Расширяется по мере добавления доменов.
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['*'],
  // dogs:view + dogs:create — у всех ролей: каталог собак читается любой ролью
  // (как у buyer), а создать собаку бэкенд разрешает любому авторизованному
  // (owner_id = создатель). Управление своей собакой — ownership-aware
  // (canManageDog), dogs:edit остаётся у breeder/admin.
  organizer: ['dashboard:view', 'shows', 'results', 'documents', 'references:view', 'ads', 'kennels:view', 'litters:view', 'classifieds:view', 'support:view', 'support:create', 'dogs:view', 'dogs:create'],
  breeder: ['dashboard:view', 'dogs', 'kennels', 'litters', 'classifieds', 'shows:view', 'references:view', 'support:view', 'support:create'],
  // Результаты вносит ОРГАНИЗАТОР выставки (бэкенд авторизует по organizer_id /
  // admin, не по роли судьи и не по привязке к рингу) — поэтому у judge НЕТ
  // results:create/edit: иначе ему показывалась бы кнопка «Оценка», дающая 403.
  // Судья видит результаты read-only (через shows:view). Внесение оценок —
  // ownership-aware (canEnterResults), как у собак (canManageDog).
  judge: ['dashboard:view', 'shows:view', 'documents', 'references:view', 'kennels:view', 'litters:view', 'classifieds:view', 'support:view', 'support:create', 'dogs:view', 'dogs:create'],
  buyer: ['dashboard:view', 'classifieds:view', 'dogs:view', 'dogs:create', 'references:view', 'kennels:view', 'litters:view', 'shows:view', 'support:view', 'support:create'],
  operator: ['dashboard:view', 'support', 'classifieds:view', 'references:view', 'kennels:view', 'litters:view', 'shows:view', 'dogs:view', 'dogs:create'],
};
