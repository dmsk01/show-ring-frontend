import type { ICampaign } from 'src/types/ad';
import type { IShowItem } from 'src/types/show';
import type { IShowEntry } from 'src/types/show-result';

import { it, describe, expectTypeOf } from 'vitest';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-13: типы расходились со схемами бэкенда.
// Проверка — на уровне типов (tsc --noEmit): тест красный, пока тип врёт.

describe('API contract types', () => {
  it('entry_fee is a Decimal serialized as string', () => {
    expectTypeOf<IShowItem['entry_fee']>().toEqualTypeOf<string | null>();
  });

  it('show entry carries attendance_status', () => {
    expectTypeOf<IShowEntry['attendance_status']>().toEqualTypeOf<
      'registered' | 'arrived' | 'admitted' | 'rejected' | 'absent'
    >();
  });

  it('campaign exposes moderation approval time', () => {
    expectTypeOf<ICampaign['approved_at']>().toEqualTypeOf<string | null>();
  });
});
