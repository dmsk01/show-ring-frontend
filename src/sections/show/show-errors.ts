import { apiErrorKey } from 'src/utils/api-error';

// Коды ошибок бэкенда (detail) для выставок, записей и результатов →
// i18n-ключи. Используется с apiErrorKey (src/utils/api-error.ts):
//   toast.error(t(apiErrorKey(error, SHOW_ERRORS) ?? fallbackKey));
export const SHOW_ERRORS: Record<string, string> = {
  // Результаты ринга (ревью бэкенда 2026-10-06, BE-03/BE-26).
  placement_taken: 'show:errors.placementTaken',
  show_not_in_progress: 'show:errors.showNotInProgress',
  entry_not_admitted: 'show:errors.entryNotAdmitted',
  winner_must_be_bob: 'show:errors.winnerMustBeBob',
  winner_must_be_big: 'show:errors.winnerMustBeBig',
  // Выставка и записи (BE-14, BE-23).
  entries_class_mismatch: 'show:errors.entriesClassMismatch',
  invalid_dates: 'show:errors.invalidDates',
  show_locked: 'show:errors.showLocked',
  registration_locked: 'show:errors.registrationLocked',
  invalid_status_transition: 'show:errors.invalidStatusTransition',
  forbidden: 'show:errors.forbidden',
  // Запись на выставку.
  dog_already_registered: 'show:errors.dogAlreadyRegistered',
  registration_not_open: 'show:errors.registrationNotOpen',
  registration_deadline_passed: 'show:errors.registrationDeadlinePassed',
  breed_not_allowed: 'show:errors.breedNotAllowed',
  class_not_available_for_age: 'show:errors.classNotAvailableForAge',
  dog_birth_date_missing: 'show:errors.dogBirthDateMissing',
};

/**
 * Текст ошибки для тоста: известный код бэкенда — переведённое сообщение,
 * иначе — текст ошибки как есть (человекочитаемые detail бэкенда) или fallback.
 */
export function showErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallbackKey: string
): string {
  const key = apiErrorKey(error, SHOW_ERRORS);
  if (key) return t(key);
  return error instanceof Error && error.message ? error.message : t(fallbackKey);
}
