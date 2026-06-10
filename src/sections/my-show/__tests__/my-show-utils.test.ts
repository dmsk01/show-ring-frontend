import { it, expect, describe } from 'vitest';

import { isEntryEditable, registeredClassIds } from '../my-show-utils';

describe('isEntryEditable', () => {
  it('true when registration_open and no deadline', () => {
    expect(isEntryEditable('registration_open', null)).toBe(true);
  });
  it('false when registration_closed', () => {
    expect(isEntryEditable('registration_closed', null)).toBe(false);
  });
  it('false when deadline passed', () => {
    expect(isEntryEditable('registration_open', '2000-01-01')).toBe(false);
  });
});

describe('registeredClassIds', () => {
  it('collects class ids for a dog excluding the edited entry', () => {
    const entries = [
      { id: 'e1', dog_id: 'd1', show_class_id: 'c1' },
      { id: 'e2', dog_id: 'd1', show_class_id: 'c2' },
      { id: 'e3', dog_id: 'd2', show_class_id: 'c3' },
    ] as any;
    expect(registeredClassIds(entries, 'd1', 'e1')).toEqual(new Set(['c2']));
  });
});
