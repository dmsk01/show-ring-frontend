export type LitterStatus = 'planned' | 'born' | 'available' | 'sold_out' | 'archived';

export const LITTER_STATUSES: LitterStatus[] = [
  'planned',
  'born',
  'available',
  'sold_out',
  'archived',
];

import type { IDogRef } from './dog';

// ----------------------------------------------------------------------

export type ILitterItem = {
  id: string;
  kennel_id: string;
  breed_id: string;
  father_id: string | null;
  mother_id: string | null;
  father: IDogRef | null;
  mother: IDogRef | null;
  born_at: string | null;
  puppies_count: number | null;
  males_count: number | null;
  females_count: number | null;
  price_from: number | null;
  price_to: number | null;
  status: LitterStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ILitterCreate = {
  kennel_id: string;
  breed_id: string;
  father_id?: string | null;
  mother_id?: string | null;
  born_at?: string | null;
  puppies_count?: number | null;
  price_from?: number | null;
  price_to?: number | null;
  status?: LitterStatus;
  description?: string | null;
};

export type ILitterUpdate = Partial<ILitterCreate>;

export type ILitterPage = {
  items: ILitterItem[];
  total: number;
  page: number;
  per_page: number;
};

export type ILitterTableFilters = {
  breed_id: string;
  status: LitterStatus | 'all';
};
