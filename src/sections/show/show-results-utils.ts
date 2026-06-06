import type { IShowEntry, IShowResult, TitleCacheItem } from 'src/types/show-result';

// ----------------------------------------------------------------------

export type GroupBy = 'class' | 'breed' | 'group' | 'ring';

export const GROUP_BY_VALUES: GroupBy[] = ['class', 'breed', 'group', 'ring'];

export type IShowResultRow = {
  entryId: string;
  catalogNumber: number | null;
  registeredBy: string;
  dogId: string;
  dogName: string;
  breedId: string | null;
  breedName: string;
  groupId: string | null;
  groupNumber: number | null;
  /** i18n-ready: either a raw group label or the sentinel key 'show:results.groupLabels.noGroup' */
  groupLabel: string;
  kennelName: string;
  classId: string | null;
  className: string;
  gradeName: string;
  placement: number | null;
  titles: TitleCacheItem[];
  ringId: string | null;
  ringNumber: number | null;
  /** i18n-ready: either a raw ring label or the sentinel key 'show:results.groupLabels.unassigned' */
  ringLabel: string;
  result?: IShowResult;
};

export type ResultGroup = { key: string; label: string; rows: IShowResultRow[] };

// Minimal shapes the util needs — callers pass real API objects (structurally compatible).
type DogLite = { id: string; name: string; breed_id: string | null; kennel_id: string | null };
type KennelLite = { id: string; name: string; kennel_prefix?: string | null };
type BreedLite = { id: string; name: string; breed_group_id?: string | null };
type GroupLite = { id: string; number: number; name: string };
type RefLite = { id: string; name: string };
type RingLite = {
  id: string;
  ring_number: number;
  breed_id?: string | null;
  breed_group_id?: string | null;
  show_class_id?: string | null;
};

export type BuildResultRowsInput = {
  entries: IShowEntry[];
  results: IShowResult[];
  dogs: DogLite[];
  kennels: KennelLite[];
  breeds: BreedLite[];
  breedGroups: GroupLite[];
  classes: RefLite[];
  grades: RefLite[];
  rings: RingLite[];
};

const PLACEHOLDER = '—';

/**
 * Sentinel values returned for missing group/ring — components translate them
 * by checking for these keys and calling t(key).
 */
export const GROUP_LABEL_NO_GROUP = 'show:results.groupLabels.noGroup';
export const RING_LABEL_UNASSIGNED = 'show:results.groupLabels.unassigned';

function byId<T extends { id: string }>(list: T[]): Map<string, T> {
  return new Map(list.map((x) => [x.id, x]));
}

export function buildResultRows(input: BuildResultRowsInput): IShowResultRow[] {
  const dogMap = byId(input.dogs);
  const kennelMap = byId(input.kennels);
  const breedMap = byId(input.breeds);
  const groupMap = byId(input.breedGroups);
  const classMap = byId(input.classes);
  const gradeMap = byId(input.grades);
  const resultByEntry = new Map(input.results.map((r) => [r.show_entry_id, r]));

  // A breed-specific ring takes priority over a group-level ring for the same class.
  const findRing = (
    classId: string,
    breedId: string | null,
    groupId: string | null
  ): RingLite | null => {
    if (breedId != null) {
      const byBreed = input.rings.find(
        (ring) => ring.show_class_id === classId && ring.breed_id === breedId
      );
      if (byBreed) return byBreed;
    }
    if (groupId != null) {
      const byGroup = input.rings.find(
        (ring) => ring.show_class_id === classId && ring.breed_group_id === groupId
      );
      if (byGroup) return byGroup;
    }
    return null;
  };

  return input.entries.map((entry) => {
    const dog = dogMap.get(entry.dog_id);
    const breed = dog?.breed_id ? breedMap.get(dog.breed_id) : undefined;
    const group = breed?.breed_group_id ? groupMap.get(breed.breed_group_id) : undefined;
    const kennel = dog?.kennel_id ? kennelMap.get(dog.kennel_id) : undefined;
    const result = resultByEntry.get(entry.id);

    const kennelName = kennel
      ? kennel.kennel_prefix
        ? `${kennel.name} (${kennel.kennel_prefix})`
        : kennel.name
      : PLACEHOLDER;

    const ring = findRing(
      entry.show_class_id,
      dog?.breed_id ?? null,
      breed?.breed_group_id ?? null
    );

    return {
      entryId: entry.id,
      catalogNumber: entry.catalog_number,
      registeredBy: entry.registered_by,
      dogId: entry.dog_id,
      dogName: dog?.name ?? PLACEHOLDER,
      breedId: dog?.breed_id ?? null,
      breedName: breed?.name ?? PLACEHOLDER,
      groupId: group?.id ?? null,
      groupNumber: group?.number ?? null,
      groupLabel: group ? `${group.number}|${group.name}` : GROUP_LABEL_NO_GROUP,
      kennelName,
      classId: entry.show_class_id,
      className: classMap.get(entry.show_class_id)?.name ?? PLACEHOLDER,
      gradeName:
        result?.grade_id ? (gradeMap.get(result.grade_id)?.name ?? PLACEHOLDER) : PLACEHOLDER,
      placement: result?.placement ?? null,
      titles: result?.titles_cache ?? [],
      ringId: ring?.id ?? null,
      ringNumber: ring?.ring_number ?? null,
      ringLabel: ring ? `${ring.ring_number}` : RING_LABEL_UNASSIGNED,
      result,
    };
  });
}

// ----------------------------------------------------------------------

const FALLBACK_KEY = '__none__';

function rowSorter(a: IShowResultRow, b: IShowResultRow): number {
  const pa = a.placement ?? Number.POSITIVE_INFINITY;
  const pb = b.placement ?? Number.POSITIVE_INFINITY;
  if (pa !== pb) return pa - pb;
  return (a.catalogNumber ?? Infinity) - (b.catalogNumber ?? Infinity);
}

// ----------------------------------------------------------------------

export type SortField =
  | 'catalog'
  | 'dog'
  | 'breed'
  | 'kennel'
  | 'class'
  | 'grade'
  | 'placement'
  | 'ring';

export type SortOrder = 'asc' | 'desc';

const SORT_ACCESSORS: Record<SortField, (row: IShowResultRow) => string | number> = {
  catalog: (r) => r.catalogNumber ?? Number.POSITIVE_INFINITY,
  dog: (r) => r.dogName,
  breed: (r) => r.breedName,
  kennel: (r) => r.kennelName,
  class: (r) => r.className,
  grade: (r) => r.gradeName,
  placement: (r) => r.placement ?? Number.POSITIVE_INFINITY,
  ring: (r) => r.ringNumber ?? Number.POSITIVE_INFINITY,
};

export const SORT_FIELDS = Object.keys(SORT_ACCESSORS) as SortField[];

/** Returns a new array sorted by the given column; unknown columns leave order unchanged. */
export function sortRows(
  rows: IShowResultRow[],
  orderBy: string,
  order: SortOrder
): IShowResultRow[] {
  const accessor = SORT_ACCESSORS[orderBy as SortField];
  if (!accessor) return rows;

  return [...rows].sort((a, b) => {
    const va = accessor(a);
    const vb = accessor(b);
    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'ru');
    return order === 'desc' ? -cmp : cmp;
  });
}

export function groupRows(rows: IShowResultRow[], groupBy: GroupBy): ResultGroup[] {
  const buckets = new Map<string, ResultGroup>();
  const order = new Map<string, number>();

  for (const row of rows) {
    let key: string;
    let label: string;
    let sortNum: number | undefined;

    if (groupBy === 'class') {
      key = row.classId ?? FALLBACK_KEY;
      label = row.className;
    } else if (groupBy === 'breed') {
      key = row.breedId ?? FALLBACK_KEY;
      label = row.breedName;
    } else if (groupBy === 'group') {
      key = row.groupId ?? FALLBACK_KEY;
      label = row.groupLabel;
      sortNum = row.groupNumber ?? undefined;
    } else {
      key = row.ringId ?? FALLBACK_KEY;
      label = row.ringLabel;
      sortNum = row.ringNumber ?? undefined;
    }

    if (!buckets.has(key)) buckets.set(key, { key, label, rows: [] });
    buckets.get(key)!.rows.push(row);
    if (sortNum !== undefined) order.set(key, sortNum);
  }

  const groups = [...buckets.values()];
  groups.forEach((g) => g.rows.sort(rowSorter));

  groups.sort((a, b) => {
    if (a.key === FALLBACK_KEY) return 1;
    if (b.key === FALLBACK_KEY) return -1;
    const na = order.get(a.key);
    const nb = order.get(b.key);
    if (na !== undefined && nb !== undefined) return na - nb;
    return a.label.localeCompare(b.label, 'ru');
  });

  return groups;
}
