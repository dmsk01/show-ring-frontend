import type { IShowItem } from 'src/types/show';

import { it, expect, describe } from 'vitest';

import {
  classifyShow,
  canEnterResults,
  showStatusI18nKey,
  SHOW_STATUS_COLOR,
  canRegisterForShow,
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

describe('canRegisterForShow', () => {
  const now = new Date('2026-06-09T12:00:00Z');

  it('allows registration when open and no deadline', () => {
    expect(canRegisterForShow('registration_open', null, now)).toBe(true);
  });

  it('allows registration when open and deadline is in the future', () => {
    expect(canRegisterForShow('registration_open', '2026-06-20', now)).toBe(true);
  });

  it('allows registration on the deadline day itself (inclusive)', () => {
    expect(canRegisterForShow('registration_open', '2026-06-09', now)).toBe(true);
  });

  it('blocks registration after the deadline has passed', () => {
    expect(canRegisterForShow('registration_open', '2026-06-01', now)).toBe(false);
  });

  it('blocks registration for any non-open status', () => {
    expect(canRegisterForShow('registration_closed', null, now)).toBe(false);
    expect(canRegisterForShow('draft', null, now)).toBe(false);
    expect(canRegisterForShow('completed', null, now)).toBe(false);
  });
});

describe('canEnterResults', () => {
  const mkShow = (organizerId: string) => ({ organizer_id: organizerId }) as unknown as IShowItem;
  const can = (granted: string[]) => (perm: string) => granted.includes(perm);

  it('allows the show owner', () => {
    expect(canEnterResults(mkShow('u1'), 'u1', can([]))).toBe(true);
  });

  it('allows admin (wildcard) even when not the owner', () => {
    expect(canEnterResults(mkShow('u1'), 'u2', can(['*']))).toBe(true);
  });

  it('denies a non-owner non-admin (judge / organizer-role with results:create)', () => {
    expect(canEnterResults(mkShow('u1'), 'u2', can(['results:create', 'shows:view']))).toBe(false);
  });

  it('denies when show or user is missing', () => {
    expect(canEnterResults(undefined, 'u1', can(['*']))).toBe(false);
    expect(canEnterResults(mkShow('u1'), undefined, can(['*']))).toBe(false);
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
