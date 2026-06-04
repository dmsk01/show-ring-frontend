export type TitleCacheItem = { code: string; name: string };

export type IShowRing = {
  id: string;
  show_id: string;
  ring_number: number;
  breed_id: string | null;
  breed_group_id: string | null;
  show_class_id: string | null;
  judge_id: string | null;
  ring_date: string | null;
  time_start: string | null;
  time_end: string | null;
  location: string | null;
};

export type IShowEntry = {
  id: string;
  show_id: string;
  dog_id: string;
  show_class_id: string;
  handler_id: string | null;
  registered_by: string;
  catalog_number: number | null;
  notes: string | null;
  created_at: string;
};

export type IShowEntryPage = {
  items: IShowEntry[];
  total: number;
  page: number;
  per_page: number;
};

export type IShowResult = {
  id: string;
  show_entry_id: string;
  judge_id: string | null;
  grade_id: string | null;
  placement: number | null;
  critique: string | null;
  is_class_winner: boolean;
  is_best_male: boolean;
  is_best_female: boolean;
  is_best_of_breed: boolean;
  is_best_junior: boolean;
  is_best_veteran: boolean;
  is_best_in_group: boolean;
  is_best_in_show: boolean;
  titles_cache: TitleCacheItem[] | null;
  created_at: string;
  updated_at: string;
};

export type IShowResultCreate = {
  show_entry_id: string;
  grade_id?: string | null;
  placement?: number | null;
  critique?: string | null;
};

export type IShowResultUpdate = {
  grade_id?: string | null;
  placement?: number | null;
  critique?: string | null;
};
