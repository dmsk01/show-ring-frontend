import type { IClassifiedImage, ClassifiedPriceKind } from 'src/types/classified';

import { fCurrency } from 'src/utils/format-number';

// Russian display labels for classified categories (shared across showcase card/grid/detail).
export const CLASSIFIED_CATEGORY_LABEL: Record<string, string> = {
  puppy_sale: 'Щенки',
  adult_sale: 'Взрослые',
  mating: 'Вязка',
  handler: 'Хендлер',
  grooming: 'Груминг',
  other: 'Другое',
};

export function formatClassifiedPrice(
  price: number | null,
  kind: ClassifiedPriceKind
): string {
  if (kind === 'free') return 'Бесплатно';
  if (kind === 'negotiable') return 'Договорная';
  return price != null ? fCurrency(price) : '—';
}

export function primaryImageFileId(images: IClassifiedImage[]): string | undefined {
  if (!images?.length) return undefined;
  const primary = images.find((img) => img.is_primary);
  return (primary ?? images[0]).file_id;
}
