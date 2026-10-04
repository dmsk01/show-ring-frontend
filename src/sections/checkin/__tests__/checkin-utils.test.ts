import { it, expect, describe } from 'vitest';

import {
  rabiesBadge,
  admitChecks,
  rejectChecks,
  scanErrorKey,
  isDeskAvailable,
  isTicketAvailable,
} from '../checkin-utils';

describe('isTicketAvailable', () => {
  it('needs checkin_enabled and an active status', () => {
    expect(isTicketAvailable({ checkin_enabled: true, status: 'registration_open' })).toBe(true);
    expect(isTicketAvailable({ checkin_enabled: true, status: 'in_progress' })).toBe(true);
    expect(isTicketAvailable({ checkin_enabled: false, status: 'in_progress' })).toBe(false);
    expect(isTicketAvailable({ checkin_enabled: true, status: 'completed' })).toBe(false);
  });
});

describe('isDeskAvailable', () => {
  it('only registration_closed / in_progress', () => {
    expect(isDeskAvailable({ checkin_enabled: true, status: 'registration_closed' })).toBe(true);
    expect(isDeskAvailable({ checkin_enabled: true, status: 'registration_open' })).toBe(false);
  });
});

describe('rabiesBadge', () => {
  it('maps validity to color', () => {
    expect(rabiesBadge({ rabies_valid_for_show: true, rabies_valid_until: '2027-03-12' })).toEqual({
      color: 'success',
      date: '2027-03-12',
    });
    expect(
      rabiesBadge({ rabies_valid_for_show: false, rabies_valid_until: '2020-01-01' }).color
    ).toBe('error');
    expect(rabiesBadge({ rabies_valid_for_show: null, rabies_valid_until: null }).color).toBe(
      'default'
    );
  });
});

describe('check presets', () => {
  it('admit = arrival + vet + docs_onsite passed', () => {
    expect(admitChecks().map((c) => `${c.kind}:${c.result}`)).toEqual([
      'arrival:passed',
      'vet:passed',
      'docs_onsite:passed',
    ]);
  });
  it('reject keeps arrival and fails the chosen check with comment', () => {
    expect(rejectChecks('vet', 'нет прививки')).toEqual([
      { kind: 'arrival', result: 'passed' },
      { kind: 'vet', result: 'failed', comment: 'нет прививки' },
    ]);
  });
});

describe('scanErrorKey', () => {
  it('maps backend detail codes', () => {
    expect(scanErrorKey('invalid_token')).toBe('desk.errors.invalidToken');
    expect(scanErrorKey('token_other_show')).toBe('desk.errors.otherShow');
    expect(scanErrorKey('no_entries')).toBe('desk.errors.noEntries');
    expect(scanErrorKey('whatever')).toBe('desk.errors.generic');
  });
});
