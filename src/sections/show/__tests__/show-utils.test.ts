import { describe, it, expect } from 'vitest';

import { classifyShow, SHOW_PAST_STATUSES, SHOW_UPCOMING_STATUSES } from '../show-utils';

describe('classifyShow', () => {
  it('buckets registration/in-progress as upcoming', () => {
    SHOW_UPCOMING_STATUSES.forEach((s) => expect(classifyShow(s)).toBe('upcoming'));
  });
  it('buckets completed as past', () => {
    SHOW_PAST_STATUSES.forEach((s) => expect(classifyShow(s)).toBe('past'));
  });
  it('returns null for draft/cancelled (not shown publicly)', () => {
    expect(classifyShow('draft')).toBeNull();
    expect(classifyShow('cancelled')).toBeNull();
  });
});
