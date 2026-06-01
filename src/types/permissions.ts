// Доменные константы — расширяем по мере развития продукта.
// Роли соответствуют RoleEnum бэкенда ShowTail.
export type Role = 'admin' | 'organizer' | 'breeder' | 'judge' | 'buyer' | 'operator';

export type Resource =
  | 'dashboard'
  | 'dogs'
  | 'kennels'
  | 'litters'
  | 'classifieds'
  | 'shows'
  | 'results'
  | 'references'
  | 'ads'
  | 'support'
  | 'admin';

export type Action = 'view' | 'create' | 'edit' | 'delete';

// Template literal union: compile-time проверка опечаток
export type Permission = '*' | Resource | `${Resource}:${Action}`;

export interface ParsedPermission {
  resource: string;
  action?: string;
  isWildcard: boolean;
}
