import type { LabelColor } from 'src/components/label';
import type { IShowResult } from 'src/types/show-result';
import type { IShowItem, ShowStatus } from 'src/types/show';

import { STATUS_TONE } from 'src/theme/semantic';

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
  draft: STATUS_TONE.neutral,
  registration_open: STATUS_TONE.active,
  registration_closed: STATUS_TONE.pending,
  in_progress: STATUS_TONE.progress,
  completed: STATUS_TONE.neutral,
  cancelled: STATUS_TONE.danger,
};

// ----------------------------------------------------------------------

/** Сегодняшняя дата по Москве, 'YYYY-MM-DD' (бэкенд: app/utils/dates.py, today_local). */
export function moscowToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Можно ли записаться на выставку: регистрация открыта и дедлайн (если задан)
 * ещё не прошёл. Дедлайн включительный и считается по московской дате, как
 * на бэкенде, — а не по поясу браузера (ревью 2026-10-09, FE-18).
 */
export function canRegisterForShow(
  status: ShowStatus,
  registrationDeadline: string | null,
  now: Date = new Date()
): boolean {
  if (status !== 'registration_open') return false;
  if (!registrationDeadline) return true;

  const deadline = registrationDeadline.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return true; // некорректную дату не считаем барьером
  return moscowToday(now) <= deadline;
}

/**
 * Управляет ли пользователь результатами выставки целиком: ВЛАДЕЛЕЦ выставки
 * (`organizer_id`) ИЛИ admin (`*`). Права судьи — по строкам, см.
 * canEditResultRow.
 */
export function canEnterResults(
  show: IShowItem | undefined,
  userId: string | undefined,
  can: (permission: string) => boolean
): boolean {
  if (!show || !userId) return false;
  return show.organizer_id === userId || can('*');
}

/** Назначение судьи на выставку (GET /shows/{id}/judges). */
export type ShowJudgeAssignment = {
  judge_id: string;
  breed_id: string | null;
  breed_group_id: string | null;
};

type ResultRowScope = { breedId: string | null; groupId: string | null };

/** Назначен ли пользователь судьёй выставки (на любую породу/группу). */
export function isShowJudge(userId: string | undefined, judges: ShowJudgeAssignment[]): boolean {
  return !!userId && judges.some((j) => j.judge_id === userId);
}

/**
 * Можно ли вносить/править результат строки. Зеркало бэкенда
 * (`_can_modify_results`, app/services/result.py): организатор и admin —
 * всегда; судья — если его назначение покрывает породу строки: та же
 * порода, та же группа FCI или назначение без породы и группы (вся
 * выставка). Ревью 2026-10-09, FE-09.
 */
export function canEditResultRow(
  row: ResultRowScope,
  ctx: {
    show: IShowItem | undefined;
    userId: string | undefined;
    can: (permission: string) => boolean;
    judges: ShowJudgeAssignment[];
  }
): boolean {
  if (canEnterResults(ctx.show, ctx.userId, ctx.can)) return true;
  if (!ctx.show || !ctx.userId) return false;
  return ctx.judges.some(
    (j) =>
      j.judge_id === ctx.userId &&
      ((j.breed_id == null && j.breed_group_id == null) ||
        (j.breed_id != null && j.breed_id === row.breedId) ||
        (j.breed_group_id != null && j.breed_group_id === row.groupId))
  );
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
