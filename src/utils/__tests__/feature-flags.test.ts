import { it, expect, describe } from 'vitest';

import { isFeatureEnabled } from 'src/utils/feature-flags';

describe('isFeatureEnabled (fail-closed)', () => {
  it('returns true only for an explicit true', () => {
    expect(isFeatureEnabled({ support: true }, 'support')).toBe(true);
  });

  it('treats an explicit false as disabled', () => {
    expect(isFeatureEnabled({ support: false }, 'support')).toBe(false);
  });

  it('treats an absent flag as disabled', () => {
    expect(isFeatureEnabled({ official_documents: true }, 'support')).toBe(false);
  });

  it('treats undefined/null snapshots as disabled', () => {
    expect(isFeatureEnabled(undefined, 'support')).toBe(false);
    expect(isFeatureEnabled(null, 'support')).toBe(false);
  });

  it('is disabled while loading, even if the value would be true', () => {
    expect(isFeatureEnabled({ support: true }, 'support', { loading: true })).toBe(false);
  });

  it('is disabled when the fetch errored', () => {
    expect(isFeatureEnabled({ support: true }, 'support', { error: new Error('boom') })).toBe(false);
  });
});
