export type ShowStatus =
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export const SHOW_STATUSES: ShowStatus[] = [
  'draft',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled',
];

export type IShowItem = {
  id: string;
  organizer_id: string;
  name: string;
  rank_id: string;
  description: string | null;
  date_start: string;
  date_end: string | null;
  city: string | null;
  country: string | null;
  venue: string | null;
  entry_fee: number | null;
  registration_deadline: string | null;
  status: ShowStatus;
  created_at: string;
  updated_at: string;
};

export type IShowCreate = {
  name: string;
  rank_id: string;
  date_start: string;
  description?: string | null;
  date_end?: string | null;
  city?: string | null;
  country?: string | null;
  venue?: string | null;
  entry_fee?: number | null;
  registration_deadline?: string | null;
};

// Backend ShowUpdate does not accept rank_id (rank is fixed on create).
export type IShowUpdate = Partial<Omit<IShowCreate, 'rank_id'>>;

export type IShowPage = {
  items: IShowItem[];
  total: number;
  page: number;
  per_page: number;
};

export type IShowFilters = {
  status: ShowStatus | 'all';
  city: string;
};

export type IMyShowItem = IShowItem & { my_entries_count: number };

export type IMyShowPage = {
  items: IMyShowItem[];
  total: number;
  page: number;
  per_page: number;
};

export type MyShowStatusGroup = 'all' | 'active' | 'past';
