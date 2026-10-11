import * as z from 'zod';

// ----------------------------------------------------------------------

/**
 * Значение `Field.Text type="number"`: при вводе это строка, а после потери
 * фокуса — число (minimal-shared transformValueOnBlur → parseFloat). Схема
 * принимает оба вида и приводит к строке, дальше работают обычные проверки
 * строки. Без этого zod отвечал «Invalid input» на любое введённое число.
 */
export function numberInput<T extends z.ZodType<string, string>>(schema: T) {
  return z.union([z.string(), z.number()]).transform(String).pipe(schema);
}

/** То же для необязательного поля: null остаётся null. */
export function nullableNumberInput<T extends z.ZodType<string | null, string | null>>(schema: T) {
  return z
    .union([z.string(), z.number()])
    .nullable()
    .transform((v) => (v == null ? null : String(v)))
    .pipe(schema);
}
