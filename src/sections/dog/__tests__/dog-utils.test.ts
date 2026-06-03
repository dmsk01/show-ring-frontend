import { describe, it, expect } from 'vitest';

import { dogPlaceholderImage } from '../dog-utils';

describe('dogPlaceholderImage', () => {
  it('returns the female cover for female', () => {
    expect(dogPlaceholderImage('female')).toContain('cover-7');
  });
  it('returns the male cover for male', () => {
    expect(dogPlaceholderImage('male')).toContain('cover-12');
  });
  it('falls back to male cover for null/undefined', () => {
    expect(dogPlaceholderImage(null)).toContain('cover-12');
    expect(dogPlaceholderImage(undefined)).toContain('cover-12');
  });
});
