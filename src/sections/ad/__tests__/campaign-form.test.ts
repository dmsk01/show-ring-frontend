import { it, expect, describe } from 'vitest';

import { getCampaignSchema, buildCampaignPayload } from '../campaign-create-edit-form';

// ----------------------------------------------------------------------

const t = ((k: string) => k) as any;
const Schema = getCampaignSchema(t);

const base = {
  name: 'Корма',
  budget: '100',
  date_start: '2026-10-10',
  date_end: '2026-11-10',
  cost_per_impression: null,
  description: null,
  status: 'draft' as const,
  advertiser_name: null,
  advertiser_inn: null,
};

describe('campaign schema', () => {
  // Бэкенд (ревью 2026-10-06, BE-05): бесплатный показ запрещён, CPI > 0.
  it('rejects zero cost per impression', () => {
    const r = Schema.safeParse({ ...base, cost_per_impression: '0' });
    expect(r.success).toBe(false);
  });

  it('accepts positive or empty cost per impression', () => {
    expect(Schema.safeParse({ ...base, cost_per_impression: '0.05' }).success).toBe(true);
    expect(Schema.safeParse(base).success).toBe(true);
  });
});

describe('buildCampaignPayload', () => {
  // null в cost_per_impression бэкенд не принимает (422): пустое поле не
  // отправляем — сработает значение по умолчанию.
  it('omits empty cost per impression', () => {
    const payload = buildCampaignPayload(base);
    expect('cost_per_impression' in payload).toBe(false);
  });

  it('sends numeric cost per impression when set', () => {
    expect(buildCampaignPayload({ ...base, cost_per_impression: '0.05' }).cost_per_impression).toBe(
      0.05
    );
  });
});

describe('campaign error translations', () => {
  it('exist in ru and en', async () => {
    const ru = (await import('src/locales/langs/ru/ad.json')).default as any;
    const en = (await import('src/locales/langs/en/ad.json')).default as any;
    for (const k of ['moderationRequired', 'invalidDates', 'budgetBelowSpent', 'forbidden']) {
      expect(typeof ru.errors[k]).toBe('string');
      expect(typeof en.errors[k]).toBe('string');
    }
    expect(typeof ru.form.statusModerationHint).toBe('string');
  });
});
