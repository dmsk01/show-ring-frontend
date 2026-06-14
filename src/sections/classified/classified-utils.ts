import type { LabelColor } from 'src/components/label';
import type { IClassifiedItem, IClassifiedImage, AnimalAvailability } from 'src/types/classified';

import { fCurrency } from 'src/utils/format-number';

/**
 * Can the user edit/delete this classified? Mirrors the backend `_check_owner`
 * (app/services/classified.py): author OR admin — and nobody else. Note this is
 * stricter than `canManageDog`: a plain `classifieds:edit` permission is NOT
 * enough, because `breeder` holds the full `classifieds` resource yet may only
 * manage their OWN listings. Authority is the backend; this just gates the UI so
 * a non-owner never sees an editable form of someone else's listing.
 */
export function canManageClassified(
  classified: Pick<IClassifiedItem, 'author_id'>,
  userId: string | null | undefined,
  isAdmin: boolean
): boolean {
  return isAdmin || (!!userId && classified.author_id === userId);
}

// Returns the i18n key for a category label.
// Translate at component call site: t(`enums.category.${code}`)
export function classifiedCategoryI18nKey(category: string): string {
  return `enums.category.${category}`;
}

// Returns the i18n key for a price kind label.
// Translate at component call site: t(`enums.priceKind.${kind}`)
export function classifiedPriceKindI18nKey(kind: string): string {
  return `enums.priceKind.${kind}`;
}

// Returns the i18n key for a status label.
// Translate at component call site: t(`enums.status.${status}`)
export function classifiedStatusI18nKey(status: string): string {
  return `enums.status.${status}`;
}

// Returns the i18n key for an availability label.
// Translate at component call site: t(`enums.availability.${availability}`)
export function classifiedAvailabilityI18nKey(availability: string): string {
  return `enums.availability.${availability}`;
}

// Shared Label colors for availability across card / detail / table.
// `sold` is intentionally muted (default) — it's a terminal state.
export const AVAILABILITY_COLOR: Record<AnimalAvailability, LabelColor> = {
  available: 'success',
  reserved: 'warning',
  sold: 'default',
};

/**
 * Formats a numeric price for display.
 * Always returns a displayable string — never an i18n key.
 * For free/negotiable kinds use `classifiedPriceKindI18nKey` + `t()` at the call site.
 *
 * Returns the formatted currency string when `price` is a number,
 * or an em dash when `price` is null/undefined.
 */
export function formatClassifiedPrice(price: number | null): string {
  return price != null ? fCurrency(price) : '—';
}

export function primaryImageFileId(images: IClassifiedImage[]): string | undefined {
  if (!images?.length) return undefined;
  const primary = images.find((img) => img.is_primary);
  return (primary ?? images[0]).file_id;
}
