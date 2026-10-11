import { it, expect, describe } from 'vitest';

import {
  sortRows,
  groupRows,
  buildResultRows,
  GROUP_LABEL_NO_GROUP,
  RING_LABEL_UNASSIGNED,
  referencesFromEntryRows,
} from '../show-results-utils';

const base = {
  entries: [
    { id: 'e1', show_id: 's', dog_id: 'd1', show_class_id: 'c1', handler_id: null, registered_by: 'u1', catalog_number: 2, notes: null, attendance_status: 'registered' as const, created_at: '' },
    { id: 'e2', show_id: 's', dog_id: 'd2', show_class_id: 'c1', handler_id: null, registered_by: 'u2', catalog_number: 1, notes: null, attendance_status: 'registered' as const, created_at: '' },
    { id: 'e3', show_id: 's', dog_id: 'd3', show_class_id: 'c2', handler_id: null, registered_by: 'u1', catalog_number: 3, notes: null, attendance_status: 'registered' as const, created_at: '' },
  ],
  results: [
    { id: 'r1', show_entry_id: 'e1', judge_id: null, grade_id: 'g1', placement: 2, critique: null, is_class_winner: false, is_best_male: false, is_best_female: false, is_best_of_breed: false, is_best_junior: false, is_best_veteran: false, is_best_in_group: false, is_best_in_show: false, titles_cache: [{ code: 'CW', name: 'Class Winner' }], created_at: '', updated_at: '' },
    { id: 'r2', show_entry_id: 'e2', judge_id: null, grade_id: 'g1', placement: 1, critique: 'good', is_class_winner: true, is_best_male: false, is_best_female: false, is_best_of_breed: false, is_best_junior: false, is_best_veteran: false, is_best_in_group: false, is_best_in_show: false, titles_cache: null, created_at: '', updated_at: '' },
  ],
  dogs: [
    { id: 'd1', name: 'Rex', breed_id: 'b1', kennel_id: 'k1' },
    { id: 'd2', name: 'Bella', breed_id: 'b1', kennel_id: null },
    { id: 'd3', name: 'Max', breed_id: 'b2', kennel_id: 'k1' },
  ],
  kennels: [{ id: 'k1', name: 'Star', kennel_prefix: 'iz Star' }],
  breeds: [
    { id: 'b1', name: 'Poodle', breed_group_id: 'bg1' },
    { id: 'b2', name: 'Boxer', breed_group_id: null },
  ],
  breedGroups: [{ id: 'bg1', number: 9, name: 'Companion' }],
  classes: [{ id: 'c1', name: 'Open' }, { id: 'c2', name: 'Junior' }],
  grades: [{ id: 'g1', name: 'Excellent' }],
  rings: [{ id: 'ring1', ring_number: 5, breed_id: 'b1', breed_group_id: null, show_class_id: 'c1' }],
};

describe('buildResultRows', () => {
  const rows = buildResultRows(base);

  it('joins dog, breed, group, kennel, class, grade', () => {
    const r = rows.find((x) => x.entryId === 'e1')!;
    expect(r.dogName).toBe('Rex');
    expect(r.breedName).toBe('Poodle');
    // groupLabel for a group row contains the group number and name separated by pipe
    expect(r.groupLabel).toContain('9');
    expect(r.groupLabel).toContain('Companion');
    expect(r.kennelName).toBe('Star (iz Star)');
    expect(r.className).toBe('Open');
    expect(r.gradeName).toBe('Excellent');
    expect(r.placement).toBe(2);
    expect(r.titles.map((tt) => tt.code)).toEqual(['CW']);
  });

  it('falls back to placeholders for missing data', () => {
    const r = rows.find((x) => x.entryId === 'e2')!;
    expect(r.kennelName).toBe('—'); // dog has no kennel
    const noRes = rows.find((x) => x.entryId === 'e3')!;
    expect(noRes.gradeName).toBe('—'); // entry has no result
    // breed b2 has no group → sentinel key returned
    expect(noRes.groupLabel).toBe(GROUP_LABEL_NO_GROUP);
    expect(noRes.titles).toEqual([]);
  });

  it('matches ring by class + breed, else sentinel key for unassigned', () => {
    // e1: ring matched → ringLabel is the ring number as a string
    expect(rows.find((x) => x.entryId === 'e1')!.ringLabel).toBe('5');
    // e3: no ring matched → sentinel key
    expect(rows.find((x) => x.entryId === 'e3')!.ringLabel).toBe(RING_LABEL_UNASSIGNED);
  });
});

describe('groupRows', () => {
  const rows = buildResultRows(base);

  it('groups by class (default) sorted, rows by placement', () => {
    const groups = groupRows(rows, 'class');
    expect(groups.map((g) => g.label)).toEqual(['Junior', 'Open']);
    const open = groups.find((g) => g.label === 'Open')!;
    expect(open.rows.map((r) => r.entryId)).toEqual(['e2', 'e1']); // placement 1 then 2
  });

  it('groups by FCI group with GROUP_LABEL_NO_GROUP sentinel last', () => {
    const groups = groupRows(rows, 'group');
    expect(groups[groups.length - 1].label).toBe(GROUP_LABEL_NO_GROUP);
  });

  it('groups by ring with RING_LABEL_UNASSIGNED sentinel last', () => {
    const groups = groupRows(rows, 'ring');
    expect(groups[groups.length - 1].label).toBe(RING_LABEL_UNASSIGNED);
  });

  it('groups by breed', () => {
    const groups = groupRows(rows, 'breed');
    expect(groups.map((g) => g.label).sort()).toEqual(['Boxer', 'Poodle']);
  });
});

describe('sortRows', () => {
  const rows = buildResultRows(base);

  it('sorts by dog name asc and desc', () => {
    expect(sortRows(rows, 'dog', 'asc').map((r) => r.dogName)).toEqual(['Bella', 'Max', 'Rex']);
    expect(sortRows(rows, 'dog', 'desc').map((r) => r.dogName)).toEqual(['Rex', 'Max', 'Bella']);
  });

  it('sorts by catalog number numerically', () => {
    expect(sortRows(rows, 'catalog', 'asc').map((r) => r.catalogNumber)).toEqual([1, 2, 3]);
  });

  it('sorts by placement with missing values last (asc)', () => {
    // e3 has no result → placement null → sorts last
    expect(sortRows(rows, 'placement', 'asc').map((r) => r.entryId)).toEqual(['e2', 'e1', 'e3']);
  });

  it('returns the same order for an unknown/non-sortable column', () => {
    expect(sortRows(rows, 'awards', 'asc')).toEqual(rows);
  });
});

// Ревью фронтенда 2026-10-09, FE-36: ринг «на породу» без класса
// (show_class_id: null) не сопоставлялся ни с одной записью.
describe('ring matching', () => {
  it('matches a breed ring without a class to entries of any class', () => {
    const rows = buildResultRows({
      ...base,
      rings: [
        { id: 'ringB1', ring_number: 3, breed_id: 'b1', breed_group_id: null, show_class_id: null },
      ],
    });
    expect(rows.find((x) => x.entryId === 'e1')!.ringNumber).toBe(3);
    expect(rows.find((x) => x.entryId === 'e2')!.ringNumber).toBe(3);
    expect(rows.find((x) => x.entryId === 'e3')!.ringNumber).toBeNull(); // другая порода
  });

  it('matches a group ring without a class', () => {
    const rows = buildResultRows({
      ...base,
      rings: [
        { id: 'ringG', ring_number: 7, breed_id: null, breed_group_id: 'bg1', show_class_id: null },
      ],
    });
    expect(rows.find((x) => x.entryId === 'e1')!.ringNumber).toBe(7);
  });

  it('prefers a class-specific ring over a breed-wide one', () => {
    const rows = buildResultRows({
      ...base,
      rings: [
        {
          id: 'ringAll',
          ring_number: 3,
          breed_id: 'b1',
          breed_group_id: null,
          show_class_id: null,
        },
        {
          id: 'ringOpen',
          ring_number: 5,
          breed_id: 'b1',
          breed_group_id: null,
          show_class_id: 'c1',
        },
      ],
    });
    expect(rows.find((x) => x.entryId === 'e1')!.ringNumber).toBe(5);
  });
});

// FE-08: строки /shows/{id}/entries/table уже содержат кличку, породу,
// питомник и класс — справочники для таблицы строятся из них, а не из первой
// страницы /dogs (гостю — 50 собак всей базы → «—» вместо кличек).
describe('referencesFromEntryRows', () => {
  const row = (over: Record<string, unknown>) => ({
    id: 'e1', show_id: 's', dog_id: 'd1', show_class_id: 'c1', handler_id: null,
    registered_by: 'u1', catalog_number: 1, notes: null,
    attendance_status: 'registered' as const, created_at: '',
    dog_name: 'Рекс', breed_id: 'b1', breed_name: 'Пудель', breed_group_id: 'bg1',
    kennel_id: 'k1', kennel_name: 'Звезда', kennel_prefix: 'из Звезды', class_name: 'Открытый',
    ...over,
  });

  it('builds dogs, kennels, breeds and classes without duplicates', () => {
    const refs = referencesFromEntryRows([
      row({}),
      row({ id: 'e2', dog_id: 'd2', dog_name: 'Белла', kennel_id: null, kennel_name: null, kennel_prefix: null }),
    ]);
    expect(refs.dogs).toEqual([
      { id: 'd1', name: 'Рекс', breed_id: 'b1', kennel_id: 'k1' },
      { id: 'd2', name: 'Белла', breed_id: 'b1', kennel_id: null },
    ]);
    expect(refs.kennels).toEqual([{ id: 'k1', name: 'Звезда', kennel_prefix: 'из Звезды' }]);
    expect(refs.breeds).toEqual([{ id: 'b1', name: 'Пудель', breed_group_id: 'bg1' }]);
    expect(refs.classes).toEqual([{ id: 'c1', name: 'Открытый' }]);
  });

  it('feeds buildResultRows so dog names are resolved for every entry', () => {
    const rows = [row({}), row({ id: 'e2', dog_id: 'd2', dog_name: 'Белла' })];
    const built = buildResultRows({
      ...referencesFromEntryRows(rows),
      entries: rows,
      results: [],
      breedGroups: [{ id: 'bg1', number: 9, name: 'Компаньоны' }],
      grades: [],
      rings: [],
    });
    expect(built.map((r) => r.dogName)).toEqual(['Рекс', 'Белла']);
    expect(built[0].kennelName).toBe('Звезда (из Звезды)');
  });
});
