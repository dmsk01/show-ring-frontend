# Спека: Питомники (browse) + собаки в tour-стиле

Дата: 2026-06-02
Статус: утверждено к реализации

## Цель

Дать обычному пользователю удобный публичный просмотр питомников и собак:

1. Пункт меню «Питомники» → страница со списком питомников (фильтрация, сортировка, пагинация).
2. Клик по питомнику → его карточка со всей информацией, включая объявления с помётами.
3. Из карточки питомника и из любого списка собак — переход на детальную карточку собаки.
4. Список собак и карточка собаки оформлены в стиле демо-компонента `tour` (`/dashboard/tour`): сетка карточек + страница деталей.

Администратору при этом остаётся табличный CRUD-инструмент управления питомниками в приватной (admin) зоне.

## Контекст и текущее состояние

- Шаблон **Minimal Kit** (Next.js 16 App Router, MUI 7, TS). Реюз готовых компонентов обязателен.
- Уже есть:
  - Пункт меню `Kennels` (`src/layouts/nav-config-dashboard.tsx`), раздел ShowTail.
  - Питомники: типы (`src/types/kennel.ts`), SWR-actions (`src/actions/kennel.ts` — `useGetKennelsList`, `useGetKennel`, CRUD), секции (`src/sections/kennel/**` — табличный список, create/edit-форма), роуты `/dashboard/kennels` (список-таблица), `/dashboard/kennels/new`, `/dashboard/kennels/[id]/edit`. **Страницы-карточки `/dashboard/kennels/[id]` нет.**
  - Собаки: типы (`src/types/dog.ts`), actions (`src/actions/dog.ts` — `useGetDogs`, `useGetDog`, `useGetDogTitles`, `useGetDogPedigree`), секции (`src/sections/dog/**` — табличный список, форма, `dog-detail-view` с вкладками Info/Titles/Pedigree), роуты `/dashboard/dogs` (таблица), `/dashboard/dogs/new`, `/dashboard/dogs/[id]` (детали), `/dashboard/dogs/[id]/edit`.
  - Помёты: типы (`src/types/litter.ts`), actions (`src/actions/litter.ts` — `useGetLittersList` с фильтром, `useGetLitter`, CRUD).
  - Демо-секция `tour` (`src/sections/tour/**`): `tour-list`, `tour-item`, `tour-sort`, `tour-search`, `tour-filters`, `tour-filters-result`, `view/tour-list-view`, `view/tour-details-view`, `tour-details-content`, `tour-details-toolbar`.
  - Права: `src/config/permissions.ts`. Релевантные ключи: `kennels` (полный, у breeder/admin), `kennels:view` (organizer/judge/buyer/operator), `dogs` (полный, breeder/admin), `dogs:view` (buyer); admin = `*`. Движок `src/utils/permissions.ts`, гард `PermissionGuard` (`src/auth/guard`).

### Бэкенд (ShowTail, проверено по `:8000/openapi.json`)

- `GET /kennels` — список, пагинация `{items, meta:{total,page,per_page}}`, фильтры `search`, `city` (используются), есть и `country` в схеме записи.
- `GET /kennels/{id}` — `KennelResponse`: `name, kennel_prefix, description, city, country, contact_phone, contact_email, website, id, owner_id, avatar_file_id, created_at, updated_at`. **Нет** флага верификации в публичном ответе (см. рекомендации).
- `GET /litters?kennel_id=&breed_id=&status=&page=&per_page=` — пагинация `{items, total, page, per_page}`. Поля: `kennel_id, breed_id, father_id, mother_id, born_at, puppies_count, males_count, females_count, price_from, price_to, status, description, id, ...`. **Нет** списка id щенков.
- `GET /dogs?breed_id=&kennel_id=&sex=&search=&page=&per_page=` — пагинация `{items, total, page, per_page}`. `DogResponse`: `kennel_id, breed_id, name, sex, date_of_birth, color, rkf_number, tattoo, microchip, father_id, mother_id, description, id, ...`. **Нет** поля фото/изображения у собаки. У собаки нет `litter_id`.
- Файлы: `GET /files/{id}` публичный (для `<img>`), `fileUrl()`/`uploadFile()` в `src/actions/file.ts`.

## Ключевые решения (по итогам уточнения)

1. **Собаки — глобально в tour-стиле.** `/dashboard/dogs` → сетка tour-карточек; `/dashboard/dogs/[id]` → детали в tour-стиле. Те же карточки используются внутри карточки питомника.
2. **Фото собак — заглушка.** В бэкенде нет фото у собак, карточка показывает placeholder-изображение (по полу), без блоков цены/рейтинга tour.
3. **Список питомников — два представления:** обычному пользователю — сетка карточек (`/dashboard/kennels`); администратору — таблица CRUD в приватной зоне (`/dashboard/admin/kennels`).

## Архитектура

### Маршруты и доступ

Публичная зона (гард `kennels:view` / `dogs:view`):
- `/dashboard/kennels` — сетка карточек питомников (фильтр поиск/город/страна, сортировка имя/новые, серверная пагинация).
- `/dashboard/kennels/[id]` — карточка питомника (НОВАЯ).
- `/dashboard/dogs` — сетка tour-карточек собак (фильтр порода/пол/питомник/поиск, сортировка, серверная пагинация).
- `/dashboard/dogs/[id]` — детали собаки в tour-стиле.

Админ-зона (гард: роль admin или право `kennels` на запись):
- `/dashboard/admin/kennels` — таблица CRUD (переезжает текущая `KennelListView`).
- Create/edit остаются: `/dashboard/kennels/new`, `/dashboard/kennels/[id]/edit` (гард `kennels`). Действия из админ-таблицы ссылаются на них.

Динамические страницы Next 16: `params: Promise<{id}>`, `await params`.

### Компоненты (новые) и реюз

**Сетка питомников** (`src/sections/kennel/`):
- `kennel-card.tsx` — карточка: обложка/аватар (`avatar_file_id`→`fileUrl`, иначе placeholder), название (ссылка на `/dashboard/kennels/[id]`), префикс, город/страна, иконки. Строится из `Card`, `Image`, `Iconify`, `Label`.
- `kennel-grid.tsx` — сетка из `kennel-card` (CSS grid, как `tour-list`).
- `view/kennel-grid-view.tsx` — страница: `CustomBreadcrumbs`, панель фильтр+сортировка+поиск (паттерн `tour-list-view`, но через `useGetKennelsList` серверно), `TablePaginationCustom` или кнопка/пагинация под сеткой, `EmptyContent`.
- Сортировка/поиск/фильтр: переиспользовать `TourSort` (generic) либо локальные обёртки. Фильтры (город/страна) — `useSetState` + параметры запроса.

**Карточка питомника** (`src/sections/kennel/`):
- `view/kennel-detail-view.tsx` — оркестратор: `useGetKennel(id)`, `useGetLittersList({kennel_id})`, `useGetDogs({kennel_id})`, `useGetBreeds()`.
  1. Шапка — реюз подхода `ProfileCover` (или `Card` + `Image` + `Avatar`): обложка/аватар, название, префикс, локация, контакты (телефон/email/сайт — ссылки), описание; кнопка «Редактировать» — `PermissionGuard`/проверка владельца.
  2. Помёты (объявления) — `kennel-litter-card.tsx`: порода (через `useGetBreeds`), `Label` со статусом, дата рождения, счётчики щенков (♂/♀/всего), диапазон цены (`fCurrency`), родители (отец/мать) — ссылки на карточку собаки (если `father_id`/`mother_id` есть), описание. Состояния loading/empty.
  3. Собаки питомника — `dog-grid` (тот же компонент сетки собак), клик → детали.

**Сетка и карточка собак** (`src/sections/dog/`):
- `dog-item.tsx` — карточка по образцу `tour-item.tsx`, построенная из примитивов: placeholder-фото (по полу), кличка (ссылка на детали), порода, пол, дата рождения, питомник, RKF #; меню `CustomPopover` (View/Edit/Delete) — действия гардятся.
- `dog-grid.tsx` — сетка из `dog-item` (как `tour-list`); принимает массив собак (используется и на `/dashboard/dogs`, и в карточке питомника).
- `dog-sort.tsx` / фильтр-панель — по образцу `tour-sort`/`tour-search`; фильтры порода/пол/питомник/поиск передаются в `useGetDogs` (серверно), сортировка имя/дата.
- `view/dog-grid-view.tsx` — заменяет текущий `dog-list-view` на `/dashboard/dogs`: breadcrumbs, панель фильтр+сортировка+поиск, сетка, серверная пагинация (`useGetDogs` отдаёт `total`), `EmptyContent`, кнопка «Add dog» (гард `dogs`).
- Текущий `dog-list-view` (таблица) — удаляется или остаётся неиспользуемым; роут переключается на grid-view. (Реализатор удаляет, чтобы не плодить мёртвый код; форма create/edit не трогается.)

**Детали собаки в tour-стиле** (`src/sections/dog/`):
- `dog-details-content.tsx` — по образцу `tour-details-content.tsx`: hero-заглушка (без `Lightbox`, т.к. одно placeholder-изображение), заголовок с чипами (порода/пол), overview-сетка (порода, пол, дата рожд., окрас, RKF, чип/microchip, питомник→ссылка, отец/мать→ссылки), описание (`Markdown`).
- `view/dog-detail-view.tsx` — рефактор существующего: тулбар по образцу `tour-details-toolbar` (назад + «Редактировать», гард), затем вкладки Info / Titles / Pedigree, где Info рендерит `dog-details-content`, Titles — существующий список, Pedigree — существующее дерево `PedigreeTree`. Сохранить уже подключённые `useGetDog/Titles/Pedigree/Breeds`.

**Админ-таблица питомников:**
- `view/kennel-list-view.tsx` (существующий) переезжает на роут `/dashboard/admin/kennels` — новый `src/app/dashboard/admin/kennels/page.tsx` с `PermissionGuard`. Breadcrumbs/ссылки обновить под admin-зону.

### Маршрутные файлы App Router (новые/изменённые)

- `src/app/dashboard/kennels/page.tsx` — рендерит `KennelGridView` (вместо таблицы).
- `src/app/dashboard/kennels/[id]/page.tsx` — НОВЫЙ, `KennelDetailView` (`await params`).
- `src/app/dashboard/admin/kennels/page.tsx` — НОВЫЙ, `KennelListView` под `PermissionGuard`.
- `src/app/dashboard/dogs/page.tsx` — рендерит `DogGridView` (вместо таблицы).
- `src/app/dashboard/dogs/[id]/page.tsx` — без изменений (рендерит обновлённый `DogDetailView`).
- `src/routes/paths.ts` — добавить `dashboard.kennels.details(id)` и `dashboard.adminKennels` (или `kennels.adminRoot`).
- `src/layouts/nav-config-dashboard.tsx` — пункт «Kennels» (публичный) → grid; добавить «Kennels (admin)» → `/dashboard/admin/kennels` с `permission`.

### Поток данных

- Списки и пагинация — серверные через существующие SWR-actions (`useGetKennelsList`, `useGetDogs`, `useGetLittersList`). В отличие от демо `tour` (клиентская фильтрация мок-данных), фильтр/сортировка/страница транслируются в query-параметры запроса. Сортировка: если бэкенд не принимает `sort` (в схеме его нет — см. рекомендации), сортируем на клиенте в пределах текущей страницы и помечаем как ограничение; либо сортируем только по доступным полям. Базово: сортировка применяется к загруженной странице (клиентски), пагинация серверная.
- Имена пород — `useGetBreeds()` (`src/actions/reference`), сопоставление по `breed_id`.
- Изображение питомника — `fileUrl(avatar_file_id)`; placeholder при отсутствии.

### Состояния и edge-cases

- Loading: `LoadingScreen` (детальные страницы) / скелет-заглушки или `EmptyContent` (сетки).
- Пусто: `EmptyContent` (нет питомников/собак/помётов).
- Не найдено (детали): «… not found» как в текущем `dog-detail-view`.
- Нет контактов/описания/родителей — graceful «—», секции скрываются если пусто.
- Права: кнопки Create/Edit/Delete и админ-таблица под `PermissionGuard`; обычный пользователь видит read-only browse.
- Адаптив: сетки mobile-first (1 колонка → 2 → 3/4), как `tour-list`.

### Тестирование

- Unit (vitest) — чистая логика: маппинг фильтров в query-параметры, клиентская сортировка, форматирование (цена/даты/счётчики щенков), выбор placeholder по полу. UI-компоненты не покрываем тяжёлыми тестами.
- Гейты обязательны: `npx tsc --noEmit` = 0, `npm run lint` = 0 (perfectionist — `eslint --fix`), `npm test` зелёно.
- Иконки `Iconify` — только зарегистрированные в `src/components/iconify/icon-sets.ts`; недостающие добавить в реестр.

## За рамками (YAGNI)

- Загрузка/хранение фото собак (нет в бэкенде).
- Прямая связь «щенок ↔ помёт» (нет `litter_id`); щенки не привязываются к помёту, показываются родители помёта и собаки питомника.
- Русские подписи пунктов меню (меню шаблона — на английском; отдельная задача локализации nav).
- Отзывы/рейтинг/«избранное»/share из tour-демо (нет данных) — не переносим.

## Рекомендации по бэкенду (ShowTail)

Не блокируют реализацию (фронт работает на текущей схеме), но заметно улучшат UX. Приоритезировано:

1. **Фото собак (высокий).** Добавить `avatar_file_id` (и/или галерею `photo_file_ids: string[]`) в `Dog`. Поля в `DogResponse`/`DogCreate`/`DogUpdate`, аналогично `Kennel.avatar_file_id`. Это убирает заглушки и делает tour-карточку и галерею деталей настоящими.
2. **Флаг верификации питомника в публичном ответе (средний).** В `KennelResponse` добавить `is_verified: bool` (он уже есть в `KennelModerationItem`). Нужен для метки «проверен» в сетке и карточке.
3. **Серверная сортировка списков (средний).** Параметры `sort_by`/`order` для `GET /kennels` и `GET /dogs` (минимум: `name`, `created_at`). Сейчас сортировка возможна только по загруженной странице — это неточно при многостраничных выборках.
4. **Связь помёт → щенки (средний).** Либо `litter_id` в `Dog`, либо `GET /litters/{id}/puppies`. Тогда в карточке помёта можно показать самих щенков (а не только родителей), и связать «объявление с пометами» с конкретными собаками.
5. **Счётчик собак/помётов у питомника (низкий).** Поля `dogs_count`/`litters_count` (или агрегаты) в `KennelResponse` — чтобы не делать доп. запросы ради цифр в карточке сетки.
6. **Развёрнутые ссылки на родителей в помёте (низкий).** В `LitterResponse` возвращать краткие объекты `father`/`mother` (`{id, name}`), чтобы не дёргать `/dogs/{id}` по каждому родителю.

## Открытые вопросы

Нет (решения зафиксированы выше). Сортировка реализуется как клиентская по странице до появления серверной (рекомендация №3).
