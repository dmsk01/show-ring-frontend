import type { IClassifiedImage } from 'src/types/classified';

import { fCurrency } from 'src/utils/format-number';

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
