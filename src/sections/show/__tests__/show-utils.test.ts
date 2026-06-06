import { it, expect, describe } from 'vitest';

import {
  classifyShow,
  showStatusI18nKey,
  SHOW_STATUS_COLOR,
  SHOW_PAST_STATUSES,
  SHOW_UPCOMING_STATUSES,
} from '../show-utils';

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

describe('showStatusI18nKey', () => {
  it('returns the correct i18n key for known statuses', () => {
    expect(showStatusI18nKey('registration_open')).toBe('enums.status.registration_open');
    expect(showStatusI18nKey('completed')).toBe('enums.status.completed');
    expect(showStatusI18nKey('cancelled')).toBe('enums.status.cancelled');
  });

  it('returns a key string for any status code', () => {
    expect(showStatusI18nKey('draft')).toBe('enums.status.draft');
  });
});

describe('SHOW_STATUS_COLOR', () => {
  it('returns correct colors for all statuses', () => {
    expect(SHOW_STATUS_COLOR.draft).toBe('default');
    expect(SHOW_STATUS_COLOR.registration_open).toBe('success');
    expect(SHOW_STATUS_COLOR.registration_closed).toBe('info');
    expect(SHOW_STATUS_COLOR.in_progress).toBe('info');
    expect(SHOW_STATUS_COLOR.completed).toBe('default');
    expect(SHOW_STATUS_COLOR.cancelled).toBe('error');
  });
});
