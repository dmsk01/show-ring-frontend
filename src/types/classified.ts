import type { DogSex } from './dog';

export type ClassifiedCategory =
  | 'puppy_sale'
  | 'adult_sale'
  | 'mating'
  | 'handler'
  | 'grooming'
  | 'other';

export type ClassifiedPriceKind = 'fixed' | 'free' | 'negotiable';

export type ClassifiedStatus = 'active' | 'moderation' | 'closed' | 'archived';

// Animal availability on a classified (backend enum AnimalAvailability).
export type AnimalAvailability = 'available' | 'reserved' | 'sold';

export const CLASSIFIED_CATEGORIES: ClassifiedCategory[] = [
  'puppy_sale',
  'adult_sale',
  'mating',
  'handler',
  'grooming',
  'other',
];

export const CLASSIFIED_PRICE_KINDS: ClassifiedPriceKind[] = ['fixed', 'free', 'negotiable'];

// Order shown in the dashboard status filter.
export const CLASSIFIED_STATUSES: ClassifiedStatus[] = [
  'active',
  'closed',
  'moderation',
  'archived',
];

export const ANIMAL_AVAILABILITIES: AnimalAvailability[] = ['available', 'reserved', 'sold'];

export type IClassifiedImage = {
  id?: string;
  file_id: string;
  position?: number;
  is_primary?: boolean;
};

export type IClassifiedItem = {
  id: string;
  author_id: string;
  category: ClassifiedCategory;
  title: string;
  description: string;
  breed_id: string | null;
  litter_id: string | null;
  // Animal sex; null for sexless categories (grooming/handler) or legacy rows.
  sex: DogSex | null;
  price: number | null;
  price_kind: ClassifiedPriceKind;
  city: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: ClassifiedStatus;
  availability: AnimalAvailability;
  views_count: number;
  images: IClassifiedImage[];
  created_at: string;
  updated_at: string;
};

export type IClassifiedCreate = {
  category: ClassifiedCategory;
  title: string;
  description: string;
  breed_id?: string | null;
  price?: number | null;
  price_kind: ClassifiedPriceKind;
  city?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  images?: IClassifiedImage[];
};

// `availability` is update-only: ClassifiedCreate does not accept it (backend defaults to `available`).
export type IClassifiedUpdate = Partial<IClassifiedCreate> & {
  status?: ClassifiedStatus;
  availability?: AnimalAvailability;
};

export type IClassifiedPage = {
  items: IClassifiedItem[];
  total: number;
  page: number;
  per_page: number;
};

export type IClassifiedFilters = {
  search: string;
  category: ClassifiedCategory | 'all';
  city: string;
  status: ClassifiedStatus | 'all';
};
