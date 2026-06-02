export type NotificationChannel = 'email' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export type EventType =
  | 'show.registration_opened'
  | 'show.results_published'
  | 'litter.announced'
  | 'dog.title_earned';

export const EVENT_TYPES: EventType[] = [
  'show.registration_opened',
  'show.results_published',
  'litter.announced',
  'dog.title_earned',
];

export const NOTIFICATION_CHANNELS: NotificationChannel[] = ['email', 'push'];

export type INotification = {
  id: string;
  user_id: string;
  event_type: string;
  channel: NotificationChannel;
  subject: string;
  status: NotificationStatus;
  error: string | null;
  sent_at: string | null;
  created_at: string;
};

export type ISubscription = {
  id: string;
  user_id: string;
  event_type: string;
  filter_breed_id: string | null;
  filter_region: string | null;
  channel: NotificationChannel;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ISubscriptionCreate = {
  event_type: EventType;
  channel?: NotificationChannel;
  filter_breed_id?: string | null;
  filter_region?: string | null;
};
