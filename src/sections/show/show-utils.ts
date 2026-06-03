import type { ShowStatus } from 'src/types/show';

export const SHOW_UPCOMING_STATUSES: ShowStatus[] = [
  'registration_open',
  'registration_closed',
  'in_progress',
];

export const SHOW_PAST_STATUSES: ShowStatus[] = ['completed'];

export type ShowBucket = 'upcoming' | 'past';

export function classifyShow(status: ShowStatus): ShowBucket | null {
  if (SHOW_UPCOMING_STATUSES.includes(status)) return 'upcoming';
  if (SHOW_PAST_STATUSES.includes(status)) return 'past';
  return null;
}
