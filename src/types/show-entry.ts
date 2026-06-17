// Запись собаки на выставку (Show Ring: /shows/{id}/entries).

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
  // enriched by GET /shows/{id}/entries/my and PATCH
  dog_name: string;
  class_code: string;
  class_name: string;
};

export type IShowEntryUpdate = {
  show_class_id?: string;
  handler_id?: string | null;
  notes?: string | null;
};

export type IShowEntryCreate = {
  dog_id: string;
  show_class_id: string;
  handler_id?: string | null;
  notes?: string | null;
};

/** Один доступный класс для собаки на конкретной выставке (по возрасту). */
export type IAvailableClass = {
  id: string;
  code: string;
  name: string;
  age_from_months: number;
  age_to_months: number | null;
  can_receive_cac: boolean;
  requires_documents: boolean;
  documents_note: string | null;
};

export type IAvailableClasses = {
  dog_id: string;
  age_at_show_months: number;
  classes: IAvailableClass[];
};
