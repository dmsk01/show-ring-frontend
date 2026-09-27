export type DogSex = 'male' | 'female';

/** Lightweight dog reference embedded in other responses (e.g. litter parents). */
export type IDogRef = {
  id: string;
  name: string;
  avatar_file_id: string | null;
};

export type IDogItem = {
  id: string;
  name: string;
  sex: DogSex;
  owner_id: string | null;
  breed_id: string;
  kennel_id: string | null;
  litter_id: string | null;
  date_of_birth: string | null;
  color: string | null;
  rkf_number: string | null;
  tattoo: string | null;
  microchip: string | null;
  father_id: string | null;
  mother_id: string | null;
  description: string | null;
  avatar_file_id: string | null;
  photo_file_ids: string[];
  created_at: string;
  updated_at: string;
};

export type IDogCreate = {
  name: string;
  sex: DogSex;
  breed_id: string;
  kennel_id?: string | null;
  date_of_birth?: string | null;
  color?: string | null;
  rkf_number?: string | null;
  tattoo?: string | null;
  microchip?: string | null;
  father_id?: string | null;
  mother_id?: string | null;
  description?: string | null;
};

export type IDogUpdate = Partial<IDogCreate>;

/** Attach an already-uploaded file (file_id from POST /files/upload) to a dog. */
export type IDogImageCreate = {
  file_id: string;
  position?: number;
  is_primary?: boolean;
};

export type IDogPage = {
  items: IDogItem[];
  total: number;
  page: number;
  per_page: number;
};

export type IDogTitle = {
  id: string;
  dog_id: string;
  title_id: string;
  show_id: string;
  judge_id: string | null;
  date_earned: string;
};

export type IPedigreeNode = {
  id: string;
  name: string;
  sex: DogSex;
  breed_id: string;
  date_of_birth: string | null;
  rkf_number: string | null;
  father: IPedigreeNode | null;
  mother: IPedigreeNode | null;
};

/**
 * Родственник в списках «Потомки»/«Сибсы». Бэкенд выводит родство из
 * father_id/mother_id — отдельно оно не хранится.
 */
export type IDogRelative = {
  id: string;
  name: string;
  sex: DogSex;
  date_of_birth: string | null;
  breed_id: string;
  rkf_number: string | null;
  owner_id: string | null;
  avatar_file_id: string | null;
};

export type IDogDescendant = IDogRelative & {
  /** Второй родитель потомка (мать для отца и наоборот); null — неизвестен. */
  other_parent: IDogRef | null;
};

export type IDogSibling = IDogRelative & {
  /** full — оба родителя общие, half — один (какой — в shared_parent). */
  kind: 'full' | 'half';
  shared_parent: 'father' | 'mother' | 'both';
};

export type IDogTableFilters = {
  search: string;
  breed_id: string;
  kennel_id: string;
  sex: DogSex | 'all';
};
