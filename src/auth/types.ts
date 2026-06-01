import type { Role } from 'src/types/permissions';

export type UserType = Record<string, any> | null;

export type AuthState = {
  user: UserType;
  loading: boolean;
};

export type AuthContextValue = {
  user: UserType;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  roles: Role[];
  permissions: string[];
  checkUserSession?: () => Promise<void>;
};
