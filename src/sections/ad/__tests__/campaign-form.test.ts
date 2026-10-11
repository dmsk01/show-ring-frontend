import { it, expect, describe } from 'vitest';

import { isAwaitingModeration } from '../campaign-table-row';
import { getCampaignBannerSchema } from '../campaign-banner-form';
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

// Ревью фронтенда 2026-10-09, FE-11: бэкенд принимает target_url только
// https:// с доменом (app/schemas/ad.py), форма — любой непустой текст.
describe('getCampaignBannerSchema', () => {
  const tBanner = ((k: string) => k) as unknown as Parameters<typeof getCampaignBannerSchema>[0];
  const banner = { placement: 'sidebar' as const, title: null, is_active: true, erid: null };
  const parse = (target_url: string) =>
    getCampaignBannerSchema(tBanner).safeParse({ ...banner, target_url });

  it.each(['http://shop.ru', 'shop.ru', 'https://localhost', 'javascript:alert(1)'])(
    'rejects %s',
    (url) => {
      expect(parse(url).success).toBe(false);
    }
  );

  it('accepts an https URL with a domain', () => {
    expect(parse('https://shop.ru/promo?utm=1').success).toBe(true);
  });
});

describe('getCampaignSchema — dates (FE-10)', () => {
  const parse = (patch: Record<string, unknown>) => Schema.safeParse({ ...base, ...patch });
  const issue = (r: ReturnType<typeof parse>, field: string) =>
    r.success ? undefined : r.error.issues.find((i) => i.path[0] === field)?.message;

  it('rejects a date that is not YYYY-MM-DD', () => {
    expect(issue(parse({ date_start: '10.10.2026' }), 'date_start')).toBe(
      'form.validation.dateInvalid'
    );
  });

  it('rejects date_end before date_start', () => {
    expect(issue(parse({ date_start: '2026-10-10', date_end: '2026-10-01' }), 'date_end')).toBe(
      'form.validation.dateEndBeforeStart'
    );
  });
});

// FE-13: кампания без approved_at ждёт модерации — владелец сам её не запустит
// (бэкенд: 403 moderation_required), список должен это показывать.
describe('isAwaitingModeration', () => {
  it('is true until an admin approves the campaign', () => {
    expect(isAwaitingModeration({ approved_at: null, status: 'draft' })).toBe(true);
    expect(isAwaitingModeration({ approved_at: '2026-10-10T10:00:00Z', status: 'active' })).toBe(
      false
    );
  });

  it('is false for finished campaigns', () => {
    expect(isAwaitingModeration({ approved_at: null, status: 'completed' })).toBe(false);
    expect(isAwaitingModeration({ approved_at: null, status: 'cancelled' })).toBe(false);
  });
});
