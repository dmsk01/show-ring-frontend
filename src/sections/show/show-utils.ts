import type { ShowStatus } from 'src/types/show';
import type { LabelColor } from 'src/components/label';
import type { IShowResult } from 'src/types/show-result';

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

// ----------------------------------------------------------------------

/**
 * Returns the i18n key for a show status label.
 * Translate at component call site: t(`enums.status.${code}`)
 */
export function showStatusI18nKey(status: string): string {
  return `enums.status.${status}`;
}

export const SHOW_STATUS_COLOR: Record<string, LabelColor> = {
  draft: 'default',
  registration_open: 'success',
  registration_closed: 'info',
  in_progress: 'info',
  completed: 'default',
  cancelled: 'error',
};

// ----------------------------------------------------------------------

/**
 * Можно ли записаться на выставку: регистрация открыта и дедлайн (если задан)
 * ещё не прошёл. Дедлайн сравниваем по концу дня (включительно).
 */
export function canRegisterForShow(
  status: ShowStatus,
  registrationDeadline: string | null,
  now: Date = new Date()
): boolean {
  if (status !== 'registration_open') return false;
  if (!registrationDeadline) return true;

  const deadline = new Date(registrationDeadline);
  if (Number.isNaN(deadline.getTime())) return true; // некорректную дату не считаем барьером
  deadline.setHours(23, 59, 59, 999);
  return now.getTime() <= deadline.getTime();
}

export const SHOW_AWARD_FLAGS: { key: keyof IShowResult; label: string }[] = [
  { key: 'is_class_winner', label: 'CW' },
  { key: 'is_best_male', label: 'BM' },
  { key: 'is_best_female', label: 'BF' },
  { key: 'is_best_junior', label: 'BJ' },
  { key: 'is_best_veteran', label: 'BV' },
  { key: 'is_best_of_breed', label: 'BOB' },
  { key: 'is_best_in_group', label: 'BIG' },
  { key: 'is_best_in_show', label: 'BIS' },
];
