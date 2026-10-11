import type { IShowItem } from 'src/types/show';

import { it, expect, describe, afterEach } from 'vitest';

import {
  isShowJudge,
  classifyShow,
  canEnterResults,
  canEditResultRow,
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

  // Ревью фронтенда 2026-10-09, FE-18: бэкенд закрывает регистрацию по
  // московской дате (today_local), а фронт считал конец дня в поясе браузера.
  describe('uses the Moscow date regardless of the browser time zone', () => {
    const originalTz = process.env.TZ;
    afterEach(() => {
      process.env.TZ = originalTz;
    });

    it.each(['Asia/Vladivostok', 'America/New_York', 'Europe/Kaliningrad'])('in %s', (tz) => {
      process.env.TZ = tz;
      // 18:00 МСК 10 октября — регистрация ещё открыта (во Владивостоке уже 11-е).
      expect(
        canRegisterForShow('registration_open', '2026-10-10', new Date('2026-10-10T15:00:00Z'))
      ).toBe(true);
      // 00:30 МСК 11 октября — закрыта (в Нью-Йорке и Калининграде ещё 10-е).
      expect(
        canRegisterForShow('registration_open', '2026-10-10', new Date('2026-10-10T21:30:00Z'))
      ).toBe(false);
    });
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
    expect(SHOW_STATUS_COLOR.registration_closed).toBe('warning');
    expect(SHOW_STATUS_COLOR.in_progress).toBe('info');
    expect(SHOW_STATUS_COLOR.completed).toBe('default');
    expect(SHOW_STATUS_COLOR.cancelled).toBe('error');
  });
});

// Ревью фронтенда 2026-10-09, FE-09: бэкенд разрешает судье вносить и
// править результаты пород, на которые он назначен (_can_modify_results),
// а UI показывал кнопки только организатору и админу.
describe('canEditResultRow', () => {
  const show = { organizer_id: 'org' } as unknown as IShowItem;
  const can = (granted: string[]) => (perm: string) => granted.includes(perm);
  const row = { breedId: 'b1', groupId: 'g1' };
  const judges = [
    { judge_id: 'j-breed', breed_id: 'b1', breed_group_id: null },
    { judge_id: 'j-group', breed_id: null, breed_group_id: 'g1' },
    { judge_id: 'j-all', breed_id: null, breed_group_id: null },
    { judge_id: 'j-other', breed_id: 'b2', breed_group_id: null },
  ];
  const check = (userId: string, granted: string[] = []) =>
    canEditResultRow(row, { show, userId, can: can(granted), judges });

  it('allows the organizer and admin', () => {
    expect(check('org')).toBe(true);
    expect(check('someone', ['*'])).toBe(true);
  });

  it('allows a judge assigned to the breed, its group or the whole show', () => {
    expect(check('j-breed')).toBe(true);
    expect(check('j-group')).toBe(true);
    expect(check('j-all')).toBe(true);
  });

  it('denies a judge of another breed and other users', () => {
    expect(check('j-other')).toBe(false);
    expect(check('buyer')).toBe(false);
  });

  it('denies everyone when the show or the user is unknown', () => {
    expect(canEditResultRow(row, { show: undefined, userId: 'org', can: can([]), judges })).toBe(
      false
    );
    expect(canEditResultRow(row, { show, userId: undefined, can: can([]), judges })).toBe(false);
  });
});

describe('isShowJudge', () => {
  const judges = [{ judge_id: 'j1', breed_id: 'b1', breed_group_id: null }];

  it('is true only for a user assigned as a judge of the show', () => {
    expect(isShowJudge('j1', judges)).toBe(true);
    expect(isShowJudge('j2', judges)).toBe(false);
    expect(isShowJudge(undefined, judges)).toBe(false);
  });
});
