import { it, expect, describe } from 'vitest';

import { getShowSchema } from 'src/sections/show/show-create-edit-form';
import { getShowResultSchema } from 'src/sections/show/show-result-dialog';
import { getLitterSchema } from 'src/sections/litter/litter-create-edit-form';
import { getCampaignSchema } from 'src/sections/ad/campaign-create-edit-form';

// ----------------------------------------------------------------------
// Найдено e2e FE-30: `Field.Text type="number"` после потери фокуса кладёт в
// форму ЧИСЛО (minimal-shared transformValueOnBlur → parseFloat), а схемы
// ждали строку — zod отвечал «Invalid input», и кампанию, помёт с ценой,
// выставку со взносом или место в результатах сохранить было нельзя.

const t = ((k: string) => k) as any;

describe('number inputs after blur', () => {
  it('campaign accepts a numeric budget', () => {
    const r = getCampaignSchema(t).safeParse({
      name: 'Корма',
      budget: 1000,
      date_start: '2026-12-01',
      date_end: '2026-12-31',
      cost_per_impression: 2.5,
      description: null,
      status: 'draft',
      advertiser_name: null,
      advertiser_inn: null,
    });
    expect(r.success).toBe(true);
    expect(r.data?.budget).toBe('1000');
  });

  it('campaign still rejects a non-positive budget', () => {
    const r = getCampaignSchema(t).safeParse({
      name: 'Корма',
      budget: 0,
      date_start: '2026-12-01',
      date_end: '2026-12-31',
      cost_per_impression: null,
      description: null,
      status: 'draft',
      advertiser_name: null,
      advertiser_inn: null,
    });
    expect(r.success).toBe(false);
  });

  it('litter accepts numeric puppies count and prices', () => {
    const r = getLitterSchema(t).safeParse({
      kennel_id: 'k1',
      breed_id: 'b1',
      status: 'planned',
      father_id: null,
      mother_id: null,
      born_at: null,
      puppies_count: 5,
      price_from: 30000,
      price_to: 50000,
      description: null,
    });
    expect(r.success).toBe(true);
    expect(r.data?.price_to).toBe('50000');
  });

  it('show accepts a numeric entry fee', () => {
    const r = getShowSchema(t).safeParse({
      name: 'Show',
      rank_id: 'rank-1',
      date_start: '2026-12-01',
      date_end: null,
      registration_deadline: null,
      city: null,
      country: null,
      venue: null,
      entry_fee: 1500,
      description: null,
    });
    expect(r.success).toBe(true);
  });

  it('result accepts a numeric placement', () => {
    const r = getShowResultSchema(t).safeParse({ grade_id: null, placement: 1, critique: null });
    expect(r.success).toBe(true);
    expect(r.data?.placement).toBe('1');
  });
});
