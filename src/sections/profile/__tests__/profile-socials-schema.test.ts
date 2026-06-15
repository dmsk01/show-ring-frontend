import { it, expect, describe } from 'vitest';

import { getSocialsSchema } from '../profile-socials-form';

// ----------------------------------------------------------------------

// Identity t: returns the key as-is so we can assert on i18n key strings.
const t = ((k: string) => k) as any;

const SocialsSchema = getSocialsSchema(t);

const empty = { instagram: '', facebook: '', vk: '', telegram: '' };

// ----------------------------------------------------------------------

describe('SocialsSchema', () => {
  it('accepts an all-empty payload (clears every link)', () => {
    expect(SocialsSchema.safeParse(empty).success).toBe(true);
  });

  it('accepts absolute http(s) URLs', () => {
    const res = SocialsSchema.safeParse({
      instagram: 'https://instagram.com/foo',
      facebook: 'http://facebook.com/bar',
      vk: 'https://vk.com/baz',
      telegram: 'https://t.me/qux',
    });
    expect(res.success).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    const res = SocialsSchema.safeParse({ ...empty, instagram: '  https://instagram.com/foo  ' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.instagram).toBe('https://instagram.com/foo');
    }
  });

  it('rejects non-absolute / non-http URLs', () => {
    for (const bad of ['instagram.com/foo', 'www.vk.com', 'ftp://x.y', 'javascript:alert(1)', 'not a url']) {
      const res = SocialsSchema.safeParse({ ...empty, telegram: bad });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toBe('profile:validation.socialUrlInvalid');
      }
    }
  });
});
