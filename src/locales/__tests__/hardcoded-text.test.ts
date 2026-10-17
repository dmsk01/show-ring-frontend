import { join, relative } from 'node:path';
import { it, expect, describe } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-27: подписи шаблона на английском
// («Account button», панель редактора, настройки темы) в русском интерфейсе.
// Подписи для людей — только через i18n.

const SRC = join(__dirname, '..', '..');

// Строковый литерал со словами латиницей в пропсах, которые видит или озвучивает
// пользователь. Не считаем CSS-селекторы `[aria-label="…"]` и маски без слов
// вроде «YYYY-MM-DD».
const PROP_RE =
  /(?<![[\w-])(aria-label|title|label|placeholder|tooltip)="([A-Za-z][^"]*[a-z][^"]*)"/g;

// То же в объектах пропсов (`'aria-label': 'Heading menu'`) и текст между тегами.
const OBJECT_PROP_RE =
  /'(aria-label|title|label|placeholder)': ['`]([A-Za-z][^'`$]*[a-z][^'`$]*)['`]/g;
// `(?<!=)` — не стрелка `=> Promise<…>` в типах; имя продукта не переводится.
const JSX_TEXT_RE = /(?<!=)>\s*(?!BisShow\s*<)([A-Z][a-z]+(?: [A-Za-z]+)*[.!?]?)\s*</g;

// Заголовок вкладки в `metadata`: часть до разделителя — по-русски (кроме имени
// продукта), как `Выставки - ${CONFIG.appName}`.
const METADATA_TITLE_RE =
  /\btitle: [`'](?!BisShow)([A-Za-z0-9][^`'|]*[a-z][^`'|]*?)\s*(?:\||-|`|')/g;

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : tsxFiles(path);
    return entry.name.endsWith('.tsx') ? [path] : [];
  });
}

function hardcodedLabels(): string[] {
  return tsxFiles(SRC).flatMap((file) => {
    const text = readFileSync(file, 'utf-8');
    const where = relative(SRC, file).replace(/\\/g, '/');
    return [
      ...[...text.matchAll(PROP_RE)].map((m) => `${where}: ${m[1]}="${m[2]}"`),
      ...[...text.matchAll(OBJECT_PROP_RE)].map((m) => `${where}: '${m[1]}': '${m[2]}'`),
      ...[...text.matchAll(JSX_TEXT_RE)].map((m) => `${where}: >${m[1]}<`),
      ...[...text.matchAll(METADATA_TITLE_RE)]
        .filter((m) => !/[А-яЁё]/.test(m[1]))
        .map((m) => `${where}: title: ${m[1]}`),
    ];
  });
}

function jsonKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => jsonKeys(v, prefix ? `${prefix}.${k}` : k));
}

// Формы множественного числа у языков разные (ru: one/few/many, en: one/other).
const baseKeys = (keys: string[]) =>
  [...new Set(keys.map((k) => k.replace(/_(zero|one|two|few|many|other)$/, '')))].sort();

describe('i18n', () => {
  it('has no hardcoded English labels in components', () => {
    expect(hardcodedLabels()).toEqual([]);
  });

  it('has the same keys in ru and en', () => {
    const langs = join(SRC, 'locales', 'langs');
    for (const file of readdirSync(join(langs, 'ru'))) {
      const ru = baseKeys(jsonKeys(JSON.parse(readFileSync(join(langs, 'ru', file), 'utf-8'))));
      const en = baseKeys(jsonKeys(JSON.parse(readFileSync(join(langs, 'en', file), 'utf-8'))));
      expect({ file, keys: en }).toEqual({ file, keys: ru });
    }
  });
});
