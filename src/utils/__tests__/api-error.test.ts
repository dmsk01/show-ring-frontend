import { it, expect, describe } from 'vitest';

import { apiErrorKey } from '../api-error';

// ----------------------------------------------------------------------

const MAP = { placement_taken: 'show:errors.placementTaken' } as const;

describe('apiErrorKey', () => {
  it('maps a known backend code to its i18n key', () => {
    expect(apiErrorKey(new Error('placement_taken'), MAP)).toBe('show:errors.placementTaken');
  });

  it('is case-insensitive and trims', () => {
    expect(apiErrorKey(new Error(' Placement_Taken '), MAP)).toBe('show:errors.placementTaken');
  });

  it('returns null for unknown codes and non-errors', () => {
    expect(apiErrorKey(new Error('something_else'), MAP)).toBeNull();
    expect(apiErrorKey(undefined, MAP)).toBeNull();
  });
});
