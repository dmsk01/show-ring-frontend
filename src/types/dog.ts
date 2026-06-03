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

export type IDogTableFilters = {
  search: string;
  breed_id: string;
  kennel_id: string;
  sex: DogSex | 'all';
};
