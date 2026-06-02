import type { Role } from 'src/types/permissions';

export type IAdminUser = {
  id: string;
  email: string;
  is_active: boolean;
  is_email_verified: boolean;
  roles: Role[];
};

export const ADMIN_ROLES: Role[] = ['admin', 'organizer', 'breeder', 'judge', 'buyer', 'operator'];

export type IKennelModeration = {
  id: string;
  owner_id: string;
  name: string;
  kennel_prefix: string | null;
  is_verified: boolean;
};

export type IClassifiedModeration = {
  id: string;
  author_id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
};
