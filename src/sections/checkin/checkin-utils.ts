import type { ShowStatus } from 'src/types/show';
import type { LabelColor } from 'src/components/label';
import type {
  IEntryCard,
  EntryCheckKind,
  AttendanceStatus,
  IEntryCheckCreate,
} from 'src/types/checkin';

// ----------------------------------------------------------------------

type ShowCheckinState = { checkin_enabled: boolean; status: ShowStatus };

const TICKET_STATUSES: ShowStatus[] = ['registration_open', 'registration_closed', 'in_progress'];
const DESK_STATUSES: ShowStatus[] = ['registration_closed', 'in_progress'];

/** Билет доступен участнику (зеркало checkin_rules.TICKET_STATUSES). */
export function isTicketAvailable(show: ShowCheckinState): boolean {
  return show.checkin_enabled && TICKET_STATUSES.includes(show.status);
}

/** Стойка принимает отметки прибытия (зеркало checkin_rules.ONSITE_STATUSES). */
export function isDeskAvailable(show: ShowCheckinState): boolean {
  return show.checkin_enabled && DESK_STATUSES.includes(show.status);
}

// ----------------------------------------------------------------------

export const ATTENDANCE_COLOR: Record<AttendanceStatus, LabelColor> = {
  registered: 'default',
  arrived: 'info',
  admitted: 'success',
  rejected: 'error',
  absent: 'warning',
};

export function rabiesBadge(
  card: Pick<IEntryCard, 'rabies_valid_for_show' | 'rabies_valid_until'>
): { color: 'success' | 'error' | 'default'; date: string | null } {
  if (card.rabies_valid_for_show === true)
    return { color: 'success', date: card.rabies_valid_until };
  if (card.rabies_valid_for_show === false)
    return { color: 'error', date: card.rabies_valid_until };
  return { color: 'default', date: card.rabies_valid_until };
}

// ----------------------------------------------------------------------
// Готовые пачки отметок для кнопок стойки.

/** «Допустить» — прибыла + ветконтроль + документы одним запросом. */
export function admitChecks(): IEntryCheckCreate[] {
  return [
    { kind: 'arrival', result: 'passed' },
    { kind: 'vet', result: 'passed' },
    { kind: 'docs_onsite', result: 'passed' },
  ];
}

/** «Не допустить» — прибытие фиксируется, проваленная проверка с комментарием. */
export function rejectChecks(
  reason: Extract<EntryCheckKind, 'vet' | 'docs_onsite'>,
  comment: string
): IEntryCheckCreate[] {
  return [
    { kind: 'arrival', result: 'passed' },
    { kind: reason, result: 'failed', comment },
  ];
}

/** «Только прибыла» — ветконтроль идёт за отдельным столом. */
export function arrivalOnlyChecks(): IEntryCheckCreate[] {
  return [{ kind: 'arrival', result: 'passed' }];
}

// ----------------------------------------------------------------------

const SCAN_ERRORS: Record<string, string> = {
  invalid_token: 'desk.errors.invalidToken',
  token_other_show: 'desk.errors.otherShow',
  no_entries: 'desk.errors.noEntries',
};

/** i18n-ключ (namespace checkin) для detail-кода ошибки скана. */
export function scanErrorKey(detail: unknown): string {
  return (typeof detail === 'string' && SCAN_ERRORS[detail]) || 'desk.errors.generic';
}
