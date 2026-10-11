import type { Role } from 'src/types/permissions';

export type UserType = Record<string, any> | null;

export type AuthState = {
  user: UserType;
  loading: boolean;
  /** Проверка сессии упала временно, пользователь неизвестен (FE-03). */
  sessionUnknown?: boolean;
};

export type AuthContextValue = {
  user: UserType;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  sessionUnknown: boolean;
  roles: Role[];
  permissions: string[];
  /** afterLogout: проверка сразу после явного выхода — ошибка значит «аноним». */
  checkUserSession?: (options?: { afterLogout?: boolean }) => Promise<void>;
};
