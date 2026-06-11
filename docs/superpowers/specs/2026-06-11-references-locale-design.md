# Локализация справочников по Accept-Language (RU + EN)

**Дата:** 2026-06-11
**Статус:** дизайн утверждён
**Репозитории:** ShowTail (`E:\Coding\python-animal-platform`) + show-ring-frontend

## Проблема

Справочники бэкенда (`/references/*`: породы, группы FCI, выставочные классы,
ранги, титулы, оценки) хранят одно поле `name` и засеяны по-русски
(`scripts/seed_references.py`, `scripts/data/fci_breeds.py`). При переключении
фронта на EN данные бэка остаются русскими: axios не шлёт `Accept-Language`,
бэкенд его не читает, английских данных нет.

## Решения (утверждены)

- **Охват:** только справочники `/references/*`. Ошибки API, пользовательский
  контент, demo-сид — вне охвата.
- **Хранение:** подход A — колонки `name_en` / `description_en` (только RU+EN
  по CLAUDE.md; русский канонический в существующих `name`/`description`).
- **Резолв локали:** заголовок `Accept-Language`; язык не определён → `ru`.
- **Контракт API не меняется:** сервер резолвит и отдаёт в существующих полях
  `name`/`description`; фолбэк на русский при пустом переводе.

## Бэкенд

### Миграция и модели

Alembic-миграция: nullable `name_en` в 7 таблиц (`animal_types`,
`breed_groups`, `breeds`, `show_classes`, `show_ranks`, `titles`, `grades`);
nullable `description_en` там, где есть `description` (все, кроме
`animal_types`). Данные не мигрируются.

### Резолв и отдача

- Зависимость `get_locale(accept_language: Header) -> Literal["ru", "en"]`:
  парс по q-весам, первый поддерживаемый язык; дефолт `ru`.
- Эндпоинты `/references/*` принимают `Depends(get_locale)` и резолвят:
  `name = name_en if locale == "en" and name_en else name` (то же для
  `description`).
- Поиск пород `?search=` — ILIKE по `name` ИЛИ `name_en` независимо от локали.
- Сортировка для `en`: `ORDER BY coalesce(name_en, name)`.
- Admin-CRUD справочников: в схемы create/update добавляются опциональные
  `name_en` / `description_en`.

### Сид

- `seed_references.py`: кортежи групп FCI, классов, рангов, титулов, оценок
  расширяются английским именем (официальная терминология FCI/РКФ).
- `scripts/data/fci_breeds.py`: 4-кортеж → 5-кортеж с официальным английским
  названием FCI.
- Идемпотентность → upsert перевода: запись существует, `name_en` пуст —
  заполняем.

## Фронтенд

- `src/lib/axios.ts`: request-интерцептор добавляет
  `Accept-Language: <i18next.language>`.
- `src/locales/use-locales.ts` → `handleChangeLang`: после успешного
  `changeLanguage` — глобальный SWR `mutate(() => true)` для перезапроса
  данных бэка на новом языке.
- Типы и actions без изменений.

## Тесты и гейты

- Бэкенд (pytest): юнит на парсер `Accept-Language` (en, ru,
  `en-US,en;q=0.9`, мусор, отсутствие → ru); интеграционные на
  `/references/*`: en отдаёт перевод, фолбэк на русский при пустом `name_en`,
  без заголовка — русский.
- Фронтенд: `npx tsc --noEmit`, `npm run lint`, `npm test` — зелёные;
  рантайм-проверка переключателя на живом бэке.

## Вне охвата

- Локализация `detail`-сообщений ошибок FastAPI.
- Пользовательский контент (собаки, питомники, объявления) и demo-сид.
- Третьи локали.
