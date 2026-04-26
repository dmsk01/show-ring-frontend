// Доменные константы — расширяем по мере развития продукта
export type Role = 'admin' | 'user';

export type Resource = 'dashboard' | 'management' | 'reports';

export type Action = 'view' | 'create' | 'edit' | 'delete';

// Template literal union: compile-time проверка опечаток
export type Permission = '*' | Resource | `${Resource}:${Action}`;

export interface ParsedPermission {
  resource: string;
  action?: string;
  isWildcard: boolean;
}
