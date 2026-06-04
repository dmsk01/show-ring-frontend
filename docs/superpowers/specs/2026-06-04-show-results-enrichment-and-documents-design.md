# Дизайн: обогащённая таблица результатов выставки + интерфейс документов

Дата: 2026-06-04
Статус: согласовано к реализации

## Контекст и проблема

Таблица результатов выставки выводит минимум информации.

- **Дашборд** (`src/sections/show/view/show-results-view.tsx`): Cat#, кличка, класс, оценка, место, награды. Группировки нет.
- **Публичная** (`src/sections/show/view/show-public-detail-view.tsx`): только место, оценка, награды, замечания — без клички и заводчика.

Нужно: разделение по группам, клички, заводчики (+ доп. инфо); для зарегистрированных пользователей — скачивание документов (.doc); единый интерфейс получения всех документов бэкенда, gated по ролям.

## Проверка бэкенда (ShowTail, `:8000`, сверено по живому OpenAPI)

Все нужные read-эндпоинты публичны (отвечают `200` без авторизации) → обогащение публичной страницы осуществимо.

Данные для обогащения (доработка бэка **не требуется**):

| Поле | Источник |
| --- | --- |
| Кличка | `entry.dog_id` → `GET /dogs` (`DogResponse.name`) |
| Заводчик / питомник | `dog.kennel_id` → `GET /kennels` (`name`, `kennel_prefix`) |
| Порода | `dog.breed_id` → `GET /references/breeds` (`BreedResponse.name`) |
| FCI-группа | `breed.breed_group_id` → `GET /references/breed-groups` (`number`, `name`) |
| Класс | `entry.show_class_id` → `GET /references/show-classes` |
| Оценка | `result.grade_id` → `GET /references/grades` |
| Место / награды / замечания | `GET /shows/{id}/results` (`ShowResultResponse`) |
| Титулы | `result.titles_cache` — массив `TitleCacheItem` (на фронте тип ошибочно `string`) |
| Ринги | `GET /shows/{id}/rings` (`ShowRingResponse`: `ring_number`, `breed_id`, `breed_group_id`, `show_class_id`, `judge_id`) |

Подсистема документов (бэк готов, UI нет), тег `documents`:

- `GET /shows/{id}/documents/readiness` — готовность по видам
- `POST /shows/{id}/official/catalog | diplomas | certificates` → `202 TaskResponse`
- `POST /shows/{id}/official/ring-sheets?ring_id=…` → `202 TaskResponse`
- `POST /shows/{id}/entries/{entry_id}/official/diploma | certificates` → `202 TaskResponse` (индивидуальные)
- `GET /shows/{id}/official/{kind}/context` — превью-контекст (опционально)
- `GET /tasks/{task_id}/download` — скачивание файла задачи (уже есть `downloadTask` в `src/actions/document.ts`)

## Решения (согласовано)

- Группировка таблицы: дефолт **по классам**, селектор переключения: классы / породы / FCI-группы / ринги.
- Обогащаем **оба** экрана (дашборд + публичная страница).
- Документы: **полный official + индивидуальные**.
- Панель документов — **секцией на странице результатов** (`/dashboard/shows/{id}/results`).
- Official-генерация доступна: **admin + organizer + judge**.

## Архитектура

Выбранный подход: клиентское обогащение + переключаемая группировка (без блокирующих доработок бэка). Единый пайплайн данных, переиспользуемый компонент таблицы на обоих экранах.

### Компонент 1 — слой данных результатов

`useShowResultRows(showId)` в `src/actions/show-result.ts`.

- Зависимые запросы (SWR): `results`, `entries`, `dogs`, `kennels`, `breeds`, `breed-groups`, `show-classes`, `grades`, `rings`.
- Строит lookup-мапы и массив `IShowResultRow`.
- Сопоставление ринга — клиентское: ищем ring, где `ring.show_class_id === entry.show_class_id` и (`ring.breed_id === dog.breed_id` **или** `ring.breed_group_id === breed.breed_group_id`). Нет совпадения → `ring = null` (бакет «Не назначено»).
- Возвращает `{ rows, loading, lookups }`.
- Объём данных: `entries` ограничены `per_page` (сейчас 200). `dogs`/`kennels` тянем достаточным `per_page` (или постранично) под число записей; для текущих выставок 200 достаточно — лимит зафиксирован как известное ограничение.

Тип строки (`src/types/show-result.ts`):

```ts
export type TitleCacheItem = { code: string; name: string };

export type IShowResultRow = {
  entry: IShowEntry;
  result?: IShowResult;
  dogName: string;
  breedName: string;
  breedGroup?: { number: number; name: string };
  kennelName?: string;       // заводчик / питомник (name + prefix)
  className: string;
  gradeName?: string;
  ring?: IShowRing;          // null → «Не назначено»
  titles: TitleCacheItem[];
};
```

Правка: `IShowResult.titles_cache` → `TitleCacheItem[] | null`.

### Компонент 2 — переиспользуемая таблица

`ShowResultsTable` в `src/sections/show/show-results-table.tsx` на примитивах шаблона (`Table`, `TableHeadCustom`, `Scrollbar`, `Label`, `Iconify`).

- Пропсы: `rows`, `loading`, `groupBy`, `onGroupByChange`, `readOnly?`, `renderRowActions?`.
- Управление группировкой: `ToggleButtonGroup`/`Select`, дефолт `class`.
- Группировка: чистая функция `groupRows(rows, groupBy)` → `Array<{ key; label; rows }>`; рендер секциями (строка-заголовок `colSpan` → строки собак).
- Колонки: Cat#, Кличка, Порода, Заводчик, Класс, Оценка, Место, Титулы, Награды, [действия].
- `renderRowActions(row)` — слот действий справа (Edit/Set + индивидуальные документы).

### Компонент 3 — экраны

- **Дашборд** (`show-results-view.tsx`): инлайн-таблицу заменяем на `ShowResultsTable` (данные из `useShowResultRows`), `renderRowActions` = Edit/Set (как сейчас) + кнопки индивидуальных документов. Добавляем секцию `ShowDocumentsPanel`.
- **Публичная** (`show-public-detail-view.tsx`): тот же `ShowResultsTable` в `readOnly`, данные из `useShowResultRows` (всё публично). Колонка «Замечания» (critique) сохраняется.

### Компонент 4 — панель документов

`ShowDocumentsPanel` в `src/sections/show/show-documents-panel.tsx`, секцией на странице результатов, role-gated.

- `GET documents/readiness` → карточки/чипы готовности по видам.
- Official-генерация (admin/organizer/judge): кнопки catalog, diplomas, certificates, ring-sheets (для ring-sheets — `Select` ринга из `/shows/{id}/rings`). Поток: `POST official/*` → `202 TaskResponse` → poll `useGetTask` → `downloadTask` при `done`.
- Индивидуальные документы: кнопка в строке таблицы для записи, где `entry.registered_by === user.id` **или** есть право official-генерации. `POST entries/{id}/official/diploma|certificates` → poll → download.
- Опционально: превью `GET official/{kind}/context` в `Dialog`.

Действия документов (`src/actions/document.ts`):

- Новые: `generateOfficial(showId, kind, params?)`, `generateEntryDocument(showId, entryId, kind)`, `getDocumentsReadiness(showId)`, `getOfficialContext(showId, kind, params?)`.
- `downloadTask` дорабатываем: имя файла из `Content-Disposition` (fallback — переданное имя).
- Новые endpoints в `src/lib/axios.ts` (`show.officialCatalog/officialDiplomas/officialCertificates/officialRingSheets`, `show.entryOfficialDiploma/entryOfficialCertificates`, `show.documentsReadiness`, `show.officialContext`).

### Компонент 5 — RBAC

`src/types/permissions.ts`: в `Resource` добавить `'documents'`.

`src/config/permissions.ts`:

- `organizer`: + `documents`
- `judge`: + `documents`
- `admin`: покрыт `*`
- Индивидуальные документы участника — по **владению записью** (`registered_by === user.id`), без отдельного права (buyer/breeder качают свой диплом).
- Публичная страница — только чтение, без действий с документами.

Гард в `ShowDocumentsPanel`: official-блок виден при `can('documents:create')`; индивидуальная кнопка — при `can('documents:create') || row.entry.registered_by === currentUserId`.

## Поток данных

1. Страница → `useShowResultRows(showId)` собирает справочники, строит `rows`.
2. `ShowResultsTable` группирует `rows` по выбранному ключу, рендерит секциями.
3. Действие документа → POST (202 TaskResponse) → `useGetTask` poll → `downloadTask` (blob, имя из заголовка).

## Обработка ошибок и состояний

- Загрузка: `TableNoData`/скелет, `loading` из хука.
- Пустые результаты: «Результаты пока не опубликованы» (как сейчас на публичной).
- Несопоставленный ринг → бакет «Не назначено».
- Отсутствующие справочные значения → «—».
- Ошибка генерации/скачивания: тост (ru), без падения страницы.
- Polling задачи: статусы pending/processing → спиннер на кнопке; failed → тост-ошибка.

## Тестирование (vitest, чистая логика)

- `buildResultRows`: join'ы (dog/kennel/breed/group/class/grade), сопоставление ринга, fallback-бакеты, парсинг `titles_cache`.
- `groupRows`: корректность по 4 ключам (class/breed/group/ring), сортировка секций, бакет «Не назначено».
- Гейты перед коммитом: `npx tsc --noEmit`, `npm run lint`, `npm test` — зелёные.

## Опциональные доработки бэкенда (не блокеры; приложение)

1. **Обогащённый ответ `/results`**: встроить `dog_name`, `kennel/breeder`, `breed`, `breed_group`, `placement` в `ShowResultResponse` (или новый `/results/full`) — убрать N join-запросов на фронте, ускорить крупные выставки.
2. **Детерминированная привязка к рингу**: добавить `entry.ring_id` либо сделать `GET /results/by-ring` группированным (секции по рингам) — убрать эвристическое сопоставление на фронте.

## Вне объёма (YAGNI)

- Экспорт/печать таблицы результатов на фронте (документы генерит бэк).
- Реалтайм-обновление результатов.
- Пагинация UI таблицы результатов (рендерим все строки выставки секциями).
