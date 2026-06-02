export type IDashboardStats = {
  total_users: number;
  verified_kennels: number;
  total_kennels: number;
  total_dogs: number;
  total_breeds: number;
  completed_shows: number;
  open_shows: number;
  active_classifieds: number;
  total_litters: number;
  active_campaigns: number;
  last_updated_at: string;
};

export type ITopBreed = {
  breed_id: string;
  breed_name: string;
  entries_count: number;
};

export type ITopCampaign = {
  id: string;
  name: string;
  spent: string;
  budget: string;
  spent_percent: number | null;
};

export type IAdsDaily = {
  day: string;
  impressions: number;
  clicks: number;
  ctr_percent: number;
};
