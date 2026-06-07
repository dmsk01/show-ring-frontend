import { it, expect, describe } from 'vitest';

import { normalizeKennelsResponse } from '../kennel';

describe('normalizeKennelsResponse', () => {
  const kennel = (id: string) => ({ id, name: `Kennel ${id}` }) as any;

  it('reads the flat page { items, total, page, per_page } shape', () => {
    const data = {
      items: [kennel('a'), kennel('b')],
      total: 42,
      page: 1,
      per_page: 12,
    };

    const result = normalizeKennelsResponse(data);

    expect(result.items).toEqual(data.items);
    expect(result.total).toBe(42);
  });

  it('handles a bare array defensively (legacy un-wrapped shape)', () => {
    const data = [kennel('a'), kennel('b'), kennel('c')];

    const result = normalizeKennelsResponse(data);

    expect(result.items).toEqual(data);
    expect(result.total).toBe(3);
  });

  it('returns empty defaults for undefined data', () => {
    const result = normalizeKennelsResponse(undefined);

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
