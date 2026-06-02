export type IKennelItem = {
  id: string;
  owner_id: string;
  name: string;
  kennel_prefix: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  avatar_file_id: string | null;
  created_at: string;
  updated_at: string;
};

export type IKennelCreate = {
  name: string;
  kennel_prefix?: string | null;
  description?: string | null;
  city?: string | null;
  country?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  website?: string | null;
};

export type IKennelUpdate = Partial<IKennelCreate> & { avatar_file_id?: string | null };

export type IKennelPage = {
  items: IKennelItem[];
  meta: { total: number; page: number; per_page: number };
};

export type IKennelTableFilters = {
  search: string;
  city: string;
};
