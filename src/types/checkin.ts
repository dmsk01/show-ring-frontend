// Регистрация прибытия на выставку (чек-ин): документы собак, персонал,
// билет участника и стойка регистратора. Зеркало app/schemas/checkin.py.

export type AttendanceStatus = 'registered' | 'arrived' | 'admitted' | 'rejected' | 'absent';

export type EntryCheckKind = 'docs_precheck' | 'arrival' | 'vet' | 'docs_onsite';

export type EntryCheckResult = 'passed' | 'failed';

export type DogDocumentKind =
  | 'vet_passport'
  | 'pedigree'
  | 'puppy_card'
  | 'working_certificate'
  | 'other';

export const DOG_DOCUMENT_KINDS: DogDocumentKind[] = [
  'vet_passport',
  'pedigree',
  'puppy_card',
  'working_certificate',
  'other',
];

export type IDogDocument = {
  id: string;
  dog_id: string;
  kind: DogDocumentKind;
  valid_until: string | null;
  created_at: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  is_current: boolean;
};

export type IEntryCheck = {
  id: string;
  kind: EntryCheckKind;
  result: EntryCheckResult;
  comment: string | null;
  document_id: string | null;
  performed_by: string | null;
  performed_by_name: string | null;
  created_at: string;
};

export type IEntryCheckCreate = {
  kind: EntryCheckKind;
  result: EntryCheckResult;
  comment?: string;
  document_id?: string;
};

export type IEntryCard = {
  entry_id: string;
  show_id: string;
  catalog_number: number | null;
  attendance_status: AttendanceStatus;
  class_code: string;
  class_name: string;
  dog: {
    id: string;
    name: string;
    microchip: string | null;
    tattoo: string | null;
    rkf_number: string | null;
    avatar_file_id: string | null;
  };
  participant_id: string;
  participant_name: string;
  participant_phone: string | null;
  documents: IDogDocument[];
  rabies_valid_until: string | null;
  rabies_valid_for_show: boolean | null;
  problems: string[];
  latest_checks: Partial<Record<EntryCheckKind, IEntryCheck>>;
};

export type IParticipantCard = {
  user_id: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  entries: IEntryCard[];
};

export type ITicketEntry = {
  entry_id: string;
  dog_id: string;
  dog_name: string;
  class_name: string;
  catalog_number: number | null;
  attendance_status: AttendanceStatus;
  problems: string[];
};

export type ITicket = {
  show_id: string;
  token: string;
  entries: ITicketEntry[];
};

export type ICheckinSummary = Record<AttendanceStatus, number> & { total: number };

export type IShowStaff = {
  user_id: string;
  role: 'registrar';
  display_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};
