import type { ShowStatus } from 'src/types/show';
import type { IShowEntry } from 'src/types/show-entry';

import { canRegisterForShow } from 'src/sections/show/show-utils';

/** Запись можно редактировать/удалять только пока регистрация открыта. */
export function isEntryEditable(
  status: ShowStatus,
  registrationDeadline: string | null
): boolean {
  return canRegisterForShow(status, registrationDeadline);
}

/**
 * Классы, на которые эта собака уже записана, кроме редактируемой записи —
 * чтобы в диалоге не дать выбрать дублирующий класс.
 */
export function registeredClassIds(
  entries: Pick<IShowEntry, 'id' | 'dog_id' | 'show_class_id'>[],
  dogId: string,
  excludeEntryId: string
): Set<string> {
  return new Set(
    entries
      .filter((e) => e.dog_id === dogId && e.id !== excludeEntryId)
      .map((e) => e.show_class_id)
  );
}
