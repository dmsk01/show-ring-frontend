export type RefFieldKind = 'text' | 'number' | 'switch' | 'animalType';

export type RefField = {
  name: string;
  label: string;
  kind: RefFieldKind;
  required?: boolean;
  /** maxLength for text fields — mirrors backend so over-long input fails fast, not as a 422. */
  maxLength?: number;
  /** min/max for number fields — mirrors backend numeric bounds. */
  min?: number;
  max?: number;
};

export type ReferenceTypeConfig = {
  key: string;
  label: string;
  listUrl: string;
  adminUrl: string;
  fields: RefField[];
  /** field names rendered as table columns (actions column is added automatically) */
  columns: string[];
};

const ANIMAL_TYPES_URL = '/references/animal-types';

// ----------------------------------------------------------------------

export const REFERENCE_TYPES: ReferenceTypeConfig[] = [
  {
    key: 'animal-types',
    label: 'Animal types',
    listUrl: ANIMAL_TYPES_URL,
    adminUrl: '/admin/references/animal-types',
    columns: ['code', 'name'],
    fields: [
      { name: 'code', label: 'Code', kind: 'text', required: true, maxLength: 32 },
      { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 128 },
    ],
  },
  {
    key: 'show-ranks',
    label: 'Show ranks',
    listUrl: '/references/show-ranks',
    adminUrl: '/admin/references/show-ranks',
    columns: ['code', 'name'],
    fields: [
      { name: 'code', label: 'Code', kind: 'text', required: true, maxLength: 64 },
      { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 255 },
      { name: 'description', label: 'Description', kind: 'text' },
    ],
  },
  {
    key: 'titles',
    label: 'Titles',
    listUrl: '/references/titles',
    adminUrl: '/admin/references/titles',
    columns: ['code', 'name', 'is_reserve'],
    fields: [
      { name: 'animal_type_id', label: 'Animal type', kind: 'animalType', required: true },
      { name: 'code', label: 'Code', kind: 'text', required: true, maxLength: 64 },
      { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 128 },
      { name: 'is_reserve', label: 'Reserve', kind: 'switch' },
      { name: 'description', label: 'Description', kind: 'text' },
    ],
  },
  {
    key: 'grades',
    label: 'Grades',
    listUrl: '/references/grades',
    adminUrl: '/admin/references/grades',
    columns: ['code', 'name'],
    fields: [
      { name: 'animal_type_id', label: 'Animal type', kind: 'animalType', required: true },
      { name: 'code', label: 'Code', kind: 'text', required: true, maxLength: 64 },
      { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 128 },
      { name: 'is_disqualifying', label: 'Disqualifying', kind: 'switch' },
      { name: 'is_puppy_grade', label: 'Puppy grade', kind: 'switch' },
      { name: 'description', label: 'Description', kind: 'text' },
    ],
  },
  {
    key: 'show-classes',
    label: 'Show classes',
    listUrl: '/references/show-classes',
    adminUrl: '/admin/references/show-classes',
    columns: ['code', 'name', 'age_from_months'],
    fields: [
      { name: 'animal_type_id', label: 'Animal type', kind: 'animalType', required: true },
      { name: 'code', label: 'Code', kind: 'text', required: true, maxLength: 64 },
      { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 128 },
      { name: 'age_from_months', label: 'Age from (months)', kind: 'number', required: true, min: 0, max: 360 },
      { name: 'age_to_months', label: 'Age to (months)', kind: 'number', min: 0, max: 360 },
      { name: 'can_receive_cac', label: 'Can receive CAC', kind: 'switch' },
      { name: 'description', label: 'Description', kind: 'text' },
    ],
  },
];

export const ANIMAL_TYPES_LIST_URL = ANIMAL_TYPES_URL;
