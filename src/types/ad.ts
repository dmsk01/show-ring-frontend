export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export const CAMPAIGN_STATUSES: CampaignStatus[] = [
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled',
];

export type BannerPlacement = 'sidebar' | 'top' | 'inline' | 'footer';

export const BANNER_PLACEMENTS: BannerPlacement[] = ['sidebar', 'top', 'inline', 'footer'];

export type ICampaign = {
  id: string;
  advertiser_id: string;
  name: string;
  description: string | null;
  budget: string;
  cost_per_impression: string | null;
  spent: string;
  date_start: string;
  date_end: string;
  status: CampaignStatus;
  // Рекламодатель для пометки «Реклама» (ст. 18.1 Закона «О рекламе»).
  advertiser_name: string | null;
  advertiser_inn: string | null;
  created_at: string;
  updated_at: string;
};

export type ICampaignCreate = {
  name: string;
  budget: number;
  date_start: string;
  date_end: string;
  description?: string | null;
  cost_per_impression?: number | null;
  advertiser_name?: string | null;
  advertiser_inn?: string | null;
};

export type ICampaignUpdate = Partial<ICampaignCreate> & { status?: CampaignStatus };

export type ICampaignStats = {
  campaign_id: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spent: string;
  budget: string;
  remaining_budget: string;
};

export type IBannerCreate = {
  target_url: string;
  placement: BannerPlacement;
  title?: string | null;
  image_file_id?: string | null;
  target_region?: string | null;
  is_active?: boolean;
  // Идентификатор рекламы из ОРД; без него бэкенд не показывает баннер.
  erid?: string | null;
};
