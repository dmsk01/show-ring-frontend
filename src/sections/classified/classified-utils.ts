import type { IClassifiedImage, ClassifiedPriceKind } from 'src/types/classified';

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
 * Formats classified price for display.
 * For free/negotiable kinds, returns an i18n KEY so the component can translate it.
 * For fixed with a price, returns the formatted currency string (locale-aware).
 * For fixed without a price, returns an em dash.
 *
 * NOTE: callers must check `kind` first — if kind is 'free' or 'negotiable',
 * translate the returned key with t(result, { ns: 'classified' }).
 */
export function formatClassifiedPrice(
  price: number | null,
  kind: ClassifiedPriceKind
): string {
  if (kind === 'free') return 'enums.priceKind.free';
  if (kind === 'negotiable') return 'enums.priceKind.negotiable';
  return price != null ? fCurrency(price) : '—';
}

export function primaryImageFileId(images: IClassifiedImage[]): string | undefined {
  if (!images?.length) return undefined;
  const primary = images.find((img) => img.is_primary);
  return (primary ?? images[0]).file_id;
}
