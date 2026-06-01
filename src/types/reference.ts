export type IBreed = {
  id: string;
  name: string;
  code: string;
  animal_type_id: string;
  breed_group_id: string | null;
};

export type IKennel = {
  id: string;
  name: string;
  kennel_prefix: string | null;
  city: string | null;
};

export type IPageMeta = { total: number; page: number; per_page: number };

export type IBreedPage = { items: IBreed[]; meta: IPageMeta };
export type IKennelPage = { items: IKennel[]; meta: IPageMeta };
