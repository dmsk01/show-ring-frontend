# Спека: Публичная витрина (питомники / животные / выставки) + tour-карточки собак

Дата: 2026-06-03
Статус: утверждено к реализации
Заменяет: 2026-06-02-kennels-browse-and-dogs-tour-design.md

## Цель

Разделить приложение на два контура:

- **Публичная витрина** — красивые сетки карточек, доступны без логина (оболочка `MainLayout`, как лендинг). Разделы: **Питомники**, **Животные (объявления)**, **Выставки**. Клик по карточке → детальная страница.
- **Приватная рабочая зона** — существующие админ/кабинет-таблицы под `/dashboard/*` (CRUD), остаются как есть.

Из карточки питомника доступны его помёты (объявления) и собаки; по клику на собаку — детальная карточка в стиле демо-компонента `tour`.

## Контекст

- Шаблон **Minimal Kit** (Next.js 16 App Router, MUI 7, TS). Реюз готовых компонентов обязателен (`src/sections/**`, `src/components/**`).
- Две оболочки:
  - `MainLayout` (`src/layouts/main`) — публичный header (меню из `src/layouts/nav-config-main.tsx`) + footer. Используется группой `(home)` (лендинг), `post`, `product`, `about-us` и др. Подключается через тонкий `layout.tsx`: `export default () => <MainLayout>{children}</MainLayout>`.
  - Dashboard (`src/app/dashboard/layout.tsx`) — приватный сайдбар. Таблицы доменов уже здесь.
- Бэкенд GET-эндпоинты `/kennels`, `/dogs`, `/shows`, `/classifieds` отдают данные **без авторизации** (проверено: 200) — публичная витрина без логина возможна.
- Локали RU+EN (`src/locales`). Статические подписи витрины — через i18n; лендинг имеет свой словарь (не трогаем).

### Данные (проверено по `:8000/openapi.json` и типам фронта)

- **Kennel** (`src/types/kennel.ts`): `name, kennel_prefix, description, city, country, contact_phone, contact_email, website, avatar_file_id, owner_id, ...`. Список `{items, meta:{total,page,per_page}}`, фильтры `search`, `city`. Хуки: `useGetKennelsList`, `useGetKennel`.
- **Dog** (`src/types/dog.ts`): `name, sex, breed_id, kennel_id, date_of_birth, color, rkf_number, microchip, father_id, mother_id, description, ...`. **Фото нет.** Список `{items,total,page,per_page}`, фильтры `breed_id, kennel_id, sex, search`. Хуки: `useGetDogs`, `useGetDog`, `useGetDogTitles`, `useGetDogPedigree`.
- **Litter** (`src/types/litter.ts`): `kennel_id, breed_id, father_id, mother_id, born_at, puppies_count, males_count, females_count, price_from, price_to, status, description`. Фильтр `kennel_id`. Хук: `useGetLittersList`. Связи «помёт→щенки» нет.
- **Classified** (`src/types/classified.ts`): `category, title, description, breed_id, litter_id, price, price_kind, city, contact_phone, contact_email, status, views_count, images:[{file_id,is_primary,position}], author_id, ...`. **Есть реальные фото.** Статусы `active/moderation/closed/archived`. Список `{items,total,page,per_page}`, фильтры `category, breed_id, city, price_from, price_to`. Хуки: `useGetClassifieds`, `useGetClassified`. ⚠️ В query-хуке **нет** `status` (см. рекомендации БЭ).
- **Show** (`src/types/show.ts`): `name, rank_id, description, date_start, date_end, city, country, venue, entry_fee, registration_deadline, status`. Статусы `draft/registration_open/registration_closed/in_progress/completed/cancelled`. Список `{items,total,page,per_page}`, фильтры `rank_id, city, status, date_from, date_to`. Хуки: `useGetShows`, `useGetShow`. Результаты: `endpoints.show.results(id)` (`GET /shows/{id}/results`).
- Файлы: `GET /files/{id}` публичный; `fileUrl(id)` (`src/actions/file.ts`).
- Породы/ранги: `useGetBreeds` (`src/actions/reference`).

### Ключевые решения (зафиксированы)

1. Витрина **без логина**, на `MainLayout`. Все 3 раздела сразу.
2. «Объявления с животными» = домен **classifieds** (у них есть фото). Публично показываем только `status='active'`.
3. Приватные таблицы `/dashboard/*` **не меняем** — это рабочий контур.
4. Фото собак нет → **заглушка** (по полу). Карточка/деталь собаки — в tour-стиле.

## Архитектура

### Маршруты витрины (новые, на `MainLayout`)

Папки `src/app/{kennels,animals,shows,dogs}` (каждая со своим `layout.tsx` → `MainLayout`, по образцу `src/app/post/layout.tsx`):

- `src/app/kennels/page.tsx` → `KennelShowcaseView` (сетка) ; `src/app/kennels/[id]/page.tsx` → `KennelDetailView` (`await params`).
- `src/app/animals/page.tsx` → `ClassifiedShowcaseView` (сетка) ; `src/app/animals/[id]/page.tsx` → `ClassifiedDetailView`.
- `src/app/shows/page.tsx` → `ShowShowcaseView` (сетка) ; `src/app/shows/[id]/page.tsx` → `ShowDetailView`.
- `src/app/dogs/[id]/page.tsx` → `DogPublicDetailView` (деталь собаки; публичная). Публичного списка собак отдельным разделом нет — собаки видны внутри карточки питомника.

`src/routes/paths.ts`: добавить публичные пути `paths.showcase = { kennels, kennel(id), animals, classified(id), shows, show(id), dog(id) }` (или плоско). Существующие `dashboard.*` не трогаем.

### Маршруты приватной зоны

Без изменений. Существующие таблицы и формы (`/dashboard/kennels`, `/dashboard/dogs`, `/dashboard/litters`, `/dashboard/classifieds`, `/dashboard/shows`, …) остаются как приватный CRUD.

### Секции и компоненты

Размещаем витринные view рядом с доменом: `src/sections/<domain>/view/<name>-showcase-view.tsx` и карточки `src/sections/<domain>/<domain>-card.tsx`, сетки `<domain>-card-grid.tsx`. Паттерн сетки/фильтров копируем с `src/sections/tour` (адаптируя под серверные данные).

**Общие витринные примитивы** (`src/sections/showcase/` или переиспользование):
- Панель фильтров/сортировки/поиска — обёртки по образцу `tour-search`/`tour-sort`/`tour-filters`, но значения уходят в query серверных хуков.
- Хедер-страницы витрины — `CustomBreadcrumbs`/заголовок (как в `tour-list-view`).

**Питомники** (`src/sections/kennel/`):
- `kennel-card.tsx` — обложка/аватар (`fileUrl(avatar_file_id)` или placeholder), название (ссылка на деталь), префикс, город/страна. Примитивы `Card`/`Image`/`Iconify`/`Label`.
- `kennel-card-grid.tsx` — CSS-grid карточек.
- `view/kennel-showcase-view.tsx` — `useGetKennelsList({page,per_page,search,city})`, фильтр (поиск/город/страна), сортировка (имя/новые, клиентски по странице — см. ниже), `TablePaginationCustom` или kennel-grid + пагинация, `EmptyContent`.
- `view/kennel-detail-view.tsx` — `useGetKennel(id)` + `useGetLittersList({kennel_id})` + `useGetDogs({kennel_id})` + `useGetBreeds()`:
  1. Шапка — подход `ProfileCover` (обложка+аватар) или `Card`+`Image`+`Avatar`: название, префикс, локация, контакты (тел/email/сайт — ссылки), описание.
  2. «Помёты (объявления)» — `kennel-litter-card.tsx`: порода, `Label` статуса, дата рождения, счётчики щенков (♂/♀/всего), диапазон цены (`fCurrency`), родители (отец/мать) — ссылки на `/dogs/[id]`, описание. Loading/empty.
  3. «Собаки питомника» — `dog-card-grid` → клик `/dogs/[id]`.

**Собаки** (`src/sections/dog/`):
- `dog-card.tsx` — по образцу `tour-item.tsx` из примитивов: placeholder-фото (по полу), кличка (ссылка на деталь), порода, пол, дата рождения, питомник, RKF #. Без цены/рейтинга. Публичная карточка — без меню действий.
- `dog-card-grid.tsx` — сетка карточек (используется в карточке питомника; принимает массив собак).
- `view/dog-public-detail-view.tsx` — tour-стиль: hero-заглушка, заголовок + чипы (порода/пол), overview-сетка (порода, пол, дата рожд., окрас, RKF, чип, питомник→`/kennels/[id]`, отец/мать→`/dogs/[id]`), описание (`Markdown`), титулы (`useGetDogTitles`), родословная (дерево `PedigreeTree` — вынести из текущего `dog-detail-view` в переиспользуемый компонент `src/sections/dog/pedigree-tree.tsx`).
- Существующий приватный `dog-detail-view` (вкладки) — не трогаем (используется в `/dashboard/dogs/[id]`); переиспользуем общий `PedigreeTree`.

**Объявления/животные** (`src/sections/classified/`):
- `classified-card.tsx` — главное фото (`fileUrl` из `images` где `is_primary`, иначе первое/placeholder), заголовок (ссылка), категория (`Label`), цена (`fCurrency` или «Бесплатно»/«Договорная» по `price_kind`), город, `views_count`.
- `classified-card-grid.tsx` — сетка.
- `view/classified-showcase-view.tsx` — `useGetClassifieds({page,per_page,category,city,...})`, фильтр (поиск/категория/город), сортировка, пагинация. Клиентский фильтр по `status==='active'` (пока БЭ не примет `status` — рекомендация).
- `view/classified-detail-view.tsx` — `useGetClassified(id)`: галерея (`Image`+`Lightbox` по всем `images`), заголовок, категория, цена, описание (`Markdown`), порода (`useGetBreeds`), город, контакты, ссылка на помёт (`/kennels/[id]` или деталь помёта) если `litter_id`.

**Выставки** (`src/sections/show/`):
- `show-card.tsx` — название (ссылка), даты (`fDateRangeShortLabel`), город/страна, площадка, `Label` статуса, взнос. Иконки `Iconify`.
- `show-card-grid.tsx` — сетка.
- `view/show-showcase-view.tsx` — `useGetShows({page,per_page,status,city})`. Переключатель **Планируемые** (`registration_open`,`registration_closed`,`in_progress`) / **Прошедшие** (`completed`) — `Tabs`; пагинация, `EmptyContent`.
- `view/show-public-detail-view.tsx` — `useGetShow(id)`: инфо (даты, площадка, взнос, дедлайн, ранг через `useGetRanks`/reference); если `status==='completed'` — секция результатов (read-only) через `useSWR(endpoints.show.results(id))`. Переиспользовать рендер-таблицу результатов из приватного `show-results-view`, выделив read-only представление, либо собрать простую таблицу из `TableHeadCustom`/`Scrollbar`.

### Навигация

`src/layouts/nav-config-main.tsx` (меню `MainLayout`): добавить пункты **Питомники** `/kennels`, **Животные** `/animals`, **Выставки** `/shows` (с иконками `Iconify`). Подписи — через i18n (RU/EN ключи). Дашборд-меню не трогаем.

### Поток данных и сортировка

- Списки/пагинация — серверные через существующие SWR-хуки; фильтры → query-параметры.
- Сортировка: бэкенд не принимает `sort` (нет в схеме) → сортируем загруженную страницу на клиенте (`orderBy`), помечаем как ограничение до серверной сортировки (рекомендация БЭ №3).
- Изображения: `fileUrl(file_id)`; placeholder при отсутствии (собаки всегда placeholder).
- Имена пород/рангов — reference-хуки, маппинг по id.

### Состояния и edge-cases

- Loading: `LoadingScreen` (детали) / скелет или `EmptyContent` (сетки).
- Пусто/не найдено: `EmptyContent`; на деталях — «… не найдено».
- Нет фото/контактов/родителей/описания — graceful «—», пустые секции скрываются.
- Только просмотр на витрине; никаких кнопок CRUD (создание/редактирование — приватная зона).
- Адаптив mobile-first: сетки 1→2→3/4 колонки (как `tour-list`).
- SEO/публичность: страницы доступны без логина; не дёргать приватные эндпоинты.

### Тестирование

- Unit (vitest), чистая логика: маппинг фильтров→query; клиентская сортировка; форматирование цены по `price_kind`; классификация show «планируемые/прошедшие» по `status`; выбор primary-изображения classified; выбор placeholder по полу.
- Гейты обязательны: `npx tsc --noEmit`=0, `npm run lint`=0 (perfectionist — `eslint --fix`), `npm test` зелёно.
- Иконки `Iconify` — только зарегистрированные в `src/components/iconify/icon-sets.ts`; недостающие добавить в реестр.

## За рамками (YAGNI)

- Фото собак (нет в БЭ → placeholder).
- Создание/редактирование с витрины (только просмотр).
- Связь щенок↔помёт (нет `litter_id` у собаки).
- Публичный отдельный список собак (собаки — внутри карточки питомника).
- «Избранное»/отзывы/share/рейтинг из tour-демо.
- Русские подписи дашборд-меню (отдельная задача локализации nav).

## Рекомендации по бэкенду (ShowTail)

Вынесены в отдельный документ для команды БЭ: `docs/superpowers/specs/2026-06-03-showcase-backend-requirements.md`. Витрина реализуема и без них (на текущей схеме, с заглушками/клиентскими обходами), но они заметно улучшат UX и корректность.

## Открытые вопросы

Нет. Сортировка — клиентская по странице до серверной (рекомендация БЭ №3). Публичный фильтр classifieds по `status` — клиентский до поддержки в БЭ (рекомендация №6).
