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
  // Согласие владельца на распространение контактов (ст. 10.1 152-ФЗ).
  // false → посторонним бэкенд отдаёт contact_*/website = null.
  contacts_public: boolean;
  avatar_file_id: string | null;
  is_verified: boolean;
  dogs_count: number;
  litters_count: number;
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
  contacts_public?: boolean;
};

export type IKennelUpdate = Partial<IKennelCreate> & { avatar_file_id?: string | null };

export type IKennelPage = {
  items: IKennelItem[];
  total: number;
  page: number;
  per_page: number;
};

export type IKennelTableFilters = {
  search: string;
  city: string;
};
