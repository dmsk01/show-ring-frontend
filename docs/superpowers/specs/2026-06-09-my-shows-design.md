# Дизайн: «Мои выставки» (личный кабинет участника)

Дата: 2026-06-09
Ветка: feat/animals-filters (или новая feat/my-shows)
Статус: согласован, готов к плану

## Цель

Дать авторизованному пользователю-участнику раздел «Мои выставки» — выставки,
на которые он записал своих собак. Раздел доступен из двух точек входа, делит
выставки табами (все / активные / прошедшие), даёт пагинацию, и позволяет
управлять своими записями (редактировать/удалять), пока регистрация открыта.

Навигация (drill-down):
**Мои выставки (сетка карточек) → карточка выставки → список моих записей → редактирование отдельной записи.**

## Решения (зафиксированы с пользователем)

1. Источник данных — **новый агрегирующий эндпоинт в бэкенде** (а не fan-out на фронте
   и не «просмотр всех выставок»). Пагинация и фильтр по группе статусов — на сервере.
2. Редактирование записи — **новый `PATCH` в бэкенде** (а не delete+recreate), чтобы
   сохранять `catalog_number` и порядок каталога.
3. Табы: **активные** = `registration_open` / `registration_closed` / `in_progress`;
   **прошедшие** = `completed` / `cancelled`. `draft` в «мои выставки» не попадает
   (на черновик нельзя записаться).
4. Кнопки **edit/delete** показываются только пока регистрация открыта
   (`canRegisterForShow`), иначе запись read-only с подсказкой.
5. Ссылка на раздел — **в двух местах**: AccountDrawer (правый ящик аккаунта) и
   левое меню дашборда. **RBAC обязателен**: и пункты навигации, и сами страницы
   гейтятся правом `dogs:view` (его имеют те, кто владеет/регистрирует собак: breeder
   через каскад `dogs`, buyer — `dogs:view`, admin — `*`). Организатор/судья/оператор
   раздел не видят. Страница показывает только записи **самого пользователя**
   (`entries/my`) — чужой состав участников не раскрывается. Бэкенд-эндпоинты тоже
   возвращают только записи текущего пользователя (проверка `registered_by`/владельца).
6. В записи **нельзя менять собаку** (смена собаки = другая запись); PATCH меняет
   только `show_class_id` / `handler_id` / `notes`.

## Бэкенд (E:\Coding\python-animal-platform) — 3 правки

Перед реализацией сверяться со схемами в `:8000/openapi.json` и существующими
роутерами выставок/записей.

### 1. `GET /shows/entries/my` (новый, агрегирующий) — для сетки

Возвращает выставки, где у текущего пользователя есть хотя бы одна запись, по одной
строке = выставка. Лёгкий ответ (без вложенного списка записей — только счётчик):

```
Query: status_group: 'all' | 'active' | 'past' = 'all'
       page: int = 1
       per_page: int = 12
Response (MyShowPage):
{
  items: MyShowItem[],   # Show-поля + my_entries_count: int
  total: int,            # число выставок (не записей) в группе
  page: int,
  per_page: int
}
MyShowItem = { ...ShowResponse, my_entries_count: int }
```

- `status_group=active` → статусы `registration_open|registration_closed|in_progress`.
- `status_group=past` → `completed|cancelled`.
- `status_group=all` → объединение обеих групп (без `draft`).
- Сортировка: `date_start desc` (ближайшие/последние сверху) — уточнить под существующий
  паттерн листинга выставок.
- Считаем и пагинируем **по выставкам** (DISTINCT show по записям пользователя).

### 2. `GET /shows/{show_id}/entries/my` (обогатить существующий) — для списка записей

Добавить в каждый элемент имена, чтобы фронт не делал N+1:

```
ShowEntryResponse += {
  dog_name: str,
  class_code: str,
  class_name: str,
}
```

(Существующие потребители — `show-register-view` — не сломаются: поля добавляются,
ничего не удаляется.)

### 3. `PATCH /shows/{show_id}/entries/{entry_id}` (новый) — редактирование записи

```
Body (ShowEntryUpdate, все поля опциональны):
{ show_class_id?: str, handler_id?: str | null, notes?: str | null }
Response: ShowEntryResponse (обогащённый)
```

- Только владелец записи (`registered_by == current_user`) или организатор.
- 409, если регистрация на выставку закрыта (статус != `registration_open` или
  дедлайн прошёл) — фронт всё равно прячет кнопки в этом случае.
- `catalog_number` не трогаем.

## Фронт — роуты и навигация

`src/routes/paths.ts`:
```ts
myShows: {
  root: `${ROOTS.DASHBOARD}/my-shows`,
  details: (id: string) => `${ROOTS.DASHBOARD}/my-shows/${id}`,
},
```

App Router (Next 16, `params: Promise<{ id }>` → `await params`):
- `src/app/dashboard/my-shows/page.tsx` → `<MyShowsListView />`
- `src/app/dashboard/my-shows/[id]/page.tsx` → `<MyShowDetailView id={id} />`

Навигация (ссылка «Мои выставки», иконка кубка) — обе точки гейтятся `dogs:view`:
- AccountDrawer: добавить пункт в `getAccountNavData` (`src/layouts/nav-config-account.tsx`),
  подпись `account:drawer.myShows`, показывать при `can('dogs:view')` (пункт получает
  доступ к `can`, как `getMyObjectLinks`).
- Левое меню дашборда: добавить личный item в `navData`
  (`src/layouts/nav-config-dashboard.tsx`) рядом с `profile`, `permission: 'dogs:view'`,
  подпись `nav:showtail.myShows`, иконка `ICONS.booking`.
- Обе страницы (`page.tsx`) обернуть в `<PermissionGuard permission="dogs:view">`
  (паттерн `src/app/dashboard/dogs/page.tsx`).

Иконку кубка для drawer (напр. `solar:cup-star-bold-duotone`) зарегистрировать в
`src/components/iconify/icon-sets.ts`, если её там нет.

## Фронт — типы (`src/types/show-entry.ts`, `src/types/show.ts`)

```ts
// show-entry.ts
export type IShowEntry = { /* existing */
  dog_name: string;
  class_code: string;
  class_name: string;
};
export type IShowEntryUpdate = {
  show_class_id?: string;
  handler_id?: string | null;
  notes?: string | null;
};

// show.ts
export type IMyShowItem = IShowItem & { my_entries_count: number };
export type IMyShowPage = {
  items: IMyShowItem[]; total: number; page: number; per_page: number;
};
export type MyShowStatusGroup = 'all' | 'active' | 'past';
```

## Фронт — actions

`src/lib/axios.ts` endpoints.show += :
```ts
myShowsList: '/shows/entries/my',
entryItem: (id: string, entryId: string) => `/shows/${id}/entries/${entryId}`,
```

`src/actions/my-show.ts` (новый):
```ts
useMyShows({ statusGroup, page, perPage }): { items, total, isLoading, error }
```
SWR-ключ — `[endpoints.show.myShowsList, { params }]`, паттерн как `useGetShows`.

`src/actions/show-entry.ts` (дополнить):
```ts
updateShowEntry(showId, entryId, payload: IShowEntryUpdate): Promise<IShowEntry>
  → axios.patch(endpoints.show.entryItem(showId, entryId)) + mutate(myEntries(showId))
deleteShowEntry(showId, entryId): Promise<void>
  → axios.delete(...) + mutate(myEntries(showId)) + mutate(myShowsList)
```
Тип возврата `useMyShowEntries` — обогащённый `IShowEntry`.

## Фронт — секции (`src/sections/my-show/`)

Переиспользуем из шаблона/проекта: визуальный язык `ShowCard`, `CardLink` +
`cardActionableSx` (`src/components/card-link`), `Label`, `Iconify`, MUI `Tabs`,
`Pagination`/`TablePaginationCustom`, `ConfirmDialog`, `EmptyContent`,
`LoadingScreen`, `Form` + `Field.*`, `toast`, `useAvailableClasses`,
`useGetMyDogs`, утилиты `classifyShow` / `canRegisterForShow` / `SHOW_STATUS_COLOR` /
`showStatusI18nKey` / `fDate` / `fCurrency`.

### `view/my-shows-list-view.tsx` — список (сетка)
- `Tabs` с тремя вкладками (все/активные/прошедшие) → управляют `statusGroup`.
- Состояние `page` (1-based). Смена таба → `setPage(1)`.
- `useMyShows({ statusGroup, page, perPage: 12 })`.
- Сетка `Grid`/`Box` карточек `MyShowCard` (адаптив: 1/2/3 колонки).
- Пагинация под сеткой (MUI `Pagination`, count = ceil(total/per_page)).
- Состояния: `LoadingScreen` при первой загрузке, `EmptyContent` если пусто.
- Заголовок через `CustomBreadcrumbs` (как на других страницах ЛК).

### `my-show-card.tsx` — карточка выставки
- Берём разметку `ShowCard` (имя+статус, даты, место, взнос) и добавляем чип
  «N записей» (`my_entries_count`, плюрализация через i18n `count`).
- Клик по карточке → `paths.dashboard.myShows.details(show.id)` (через `CardLink`/
  stretched link; визуал `cardActionableSx`).

### `view/my-show-detail-view.tsx` — детали выставки + список записей
- `id` из роута. `useGetShow(id)` (шапка) + `useMyShowEntries(id)` (записи) +
  `useGetMyDogs()` (резерв для имени, если бэк не обогатил — но основной источник
  имён теперь сам ответ).
- Кнопка назад → `paths.dashboard.myShows.root`.
- Шапка: имя, статус (`Label`), даты, место, взнос, дедлайн.
- `editable = canRegisterForShow(show.status, show.registration_deadline)`.
- Список записей: для каждой — собака (`dog_name`), класс (`class_name`/`class_code`),
  кат.№, заметки. Если `editable` — кнопки **Редактировать** (открывает диалог) и
  **Удалить** (`ConfirmDialog` → `deleteShowEntry`). Иначе — read-only + подсказка
  (`myShows.detail.locked`).
- Если `editable` — кнопка «Записать ещё собаку» → существующая страница регистрации
  `paths.showcase.showRegister(id)`.
- Пустой список записей (теоретически, если все удалены) → `EmptyContent`.

### `my-show-entry-edit-dialog.tsx` — редактирование записи
- MUI `Dialog` + `Form` (`react-hook-form` + `zod`).
- Поля: класс (`Field.Select`, опции из `useAvailableClasses(showId, entry.dog_id)`),
  заметки (`Field.Text` multiline). Хендлер — опционально (если в проекте есть выбор
  хендлера; иначе оставить только class+notes в первой итерации).
- Собака показана как read-only (имя), не редактируется.
- Submit → `updateShowEntry(showId, entry.id, payload)` → `toast.success` → закрыть +
  revalidate.
- Защита от дубля пары собака↔класс (как в `show-register-view`): не давать выбрать
  класс, на который эта собака уже записана.

## i18n (RU + EN)

- `src/locales/langs/{ru,en}/show.json` → ветка `myShows`:
  ```
  myShows: {
    title, breadcrumb,
    tabs: { all, active, past },
    card: { entriesCount },            // плюрализация
    detail: { back, heading, locked, addDog, empty },
    entry: { dog, class, catalogNumber, notes, edit, delete },
    editDialog: { title, fields: { class, notes }, submit, dogReadonly },
    delete: { title, message, confirm },
    toast: { updated, deleted, failed },
    empty: { title, description }
  }
  ```
- `src/locales/langs/{ru,en}/account.json` → `drawer.myShows`.
- `src/locales/langs/{ru,en}/nav.json` → `showtail.myShows`.
- RU — дефолтная локаль; обе заполнить.

## Edge-cases и состояния

- Бэкенд недоступен / 401 → стандартный axios-обработчик (single-flight refresh).
- Пустые табы (нет записей в группе) → `EmptyContent` с осмысленным текстом.
- Регистрация закрылась, пока юзер на странице деталей → кнопки скрыты (вычисляется
  из `show.status`/deadline на каждый рендер); PATCH/DELETE при гонке вернёт 409/403 →
  `toast.error` + revalidate.
- Удаление последней записи на выставку → после revalidate выставка пропадёт из сетки.
- Плюрализация «N записей» / «N собак» — через i18next count.

## Проверки (гейты) перед коммитом

- `npx tsc --noEmit` → 0 ошибок.
- `npm run lint` (импорты — `npx eslint --fix`) → 0 ошибок.
- `npm test` → зелёно. Юнит-тесты чистой логики: маппинг `status_group`,
  классификация active/past, гейтинг кнопок (`canRegisterForShow`), защита от дубля
  собака↔класс.
- Рантайм-проверку делать, когда `:8000/health/` отвечает 200 (после правок бэка).

## Что НЕ делаем (YAGNI)

- Не делаем смену собаки в записи (это новая запись).
- Не делаем массовые операции над записями.
- Не трогаем организаторский раздел выставок (`paths.dashboard.shows`).
- Не добавляем фильтры/поиск в сетку сверх трёх табов (пока).
