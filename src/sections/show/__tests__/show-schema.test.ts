import { it, expect, describe } from 'vitest';

import { getShowSchema } from '../show-create-edit-form';

// ----------------------------------------------------------------------

// Identity t: returns the key as-is so we can assert on i18n key strings.
const t = ((k: string) => k) as any;

const ShowSchema = getShowSchema(t);

const base = {
  name: 'Show',
  rank_id: 'rank-1',
  date_start: '2026-07-10',
  date_end: null,
  registration_deadline: null,
  city: null,
  country: null,
  venue: null,
  entry_fee: null,
  description: null,
};

function issueAt(result: ReturnType<typeof ShowSchema.safeParse>, field: string) {
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path[0] === field)?.message;
}

// ----------------------------------------------------------------------

describe('getShowSchema — date cross-validation (mirrors backend ShowBase rules)', () => {
  it('accepts date_start alone', () => {
    expect(ShowSchema.safeParse(base).success).toBe(true);
  });

  it('accepts date_end equal to date_start (single-day show)', () => {
    expect(ShowSchema.safeParse({ ...base, date_end: '2026-07-10' }).success).toBe(true);
  });

  it('accepts date_end after date_start', () => {
    expect(ShowSchema.safeParse({ ...base, date_end: '2026-07-12' }).success).toBe(true);
  });

  it('rejects date_end before date_start', () => {
    const res = ShowSchema.safeParse({ ...base, date_end: '2026-07-09' });
    expect(res.success).toBe(false);
    expect(issueAt(res, 'date_end')).toBe('show:form.validation.dateEndBeforeStart');
  });

  it('accepts registration_deadline on date_start (inclusive)', () => {
    expect(
      ShowSchema.safeParse({ ...base, registration_deadline: '2026-07-10' }).success
    ).toBe(true);
  });

  it('accepts registration_deadline before date_start', () => {
    expect(
      ShowSchema.safeParse({ ...base, registration_deadline: '2026-07-01' }).success
    ).toBe(true);
  });

  it('rejects registration_deadline after date_start', () => {
    const res = ShowSchema.safeParse({ ...base, registration_deadline: '2026-07-11' });
    expect(res.success).toBe(false);
    expect(issueAt(res, 'registration_deadline')).toBe('show:form.validation.deadlineAfterStart');
  });

  it('reports both violations at once on their own fields', () => {
    const res = ShowSchema.safeParse({
      ...base,
      date_end: '2026-07-01',
      registration_deadline: '2026-08-01',
    });
    expect(res.success).toBe(false);
    expect(issueAt(res, 'date_end')).toBe('show:form.validation.dateEndBeforeStart');
    expect(issueAt(res, 'registration_deadline')).toBe('show:form.validation.deadlineAfterStart');
  });
});
