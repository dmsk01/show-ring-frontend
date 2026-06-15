// ----------------------------------------------------------------------
// Чистые помощники для админ-квот загрузки. Бэкенд хранит объём в байтах;
// в UI редактируем в мегабайтах. daily_limit и max_storage_bytes — оба > 0.
// ----------------------------------------------------------------------

const BYTES_PER_MB = 1024 * 1024;

/** Байты → мегабайты, округление до целого (для редактирования в форме). */
export function bytesToMb(bytes: number): number {
  return Math.round(bytes / BYTES_PER_MB);
}

/** Мегабайты → байты. */
export function mbToBytes(mb: number): number {
  return Math.round(mb * BYTES_PER_MB);
}

/** Зеркало бэка: оба значения — целые > 0. */
export function isValidQuota(dailyLimit: number, maxStorageBytes: number): boolean {
  return (
    Number.isInteger(dailyLimit) &&
    dailyLimit > 0 &&
    Number.isInteger(maxStorageBytes) &&
    maxStorageBytes > 0
  );
}
