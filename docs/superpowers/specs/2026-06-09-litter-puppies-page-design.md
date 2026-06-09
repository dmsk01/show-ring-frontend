# Спека: публичная страница помёта со щенками

**Дата:** 2026-06-09
**Ветка:** feat/animals-filters (или новая feat/litter-page)

## Цель

При клике на карточку помёта на странице питомника (`/kennels/[id]`) — переход на
новую публичную страницу помёта `/litters/[id]` с сеткой карточек щенков.

## Контекст (что уже есть)

- `KennelLitterCard` (`src/sections/kennel/kennel-litter-card.tsx`) — карточка помёта на
  странице питомника. Сейчас **некликабельна**; внутри уже есть `<Link>` на родителей.
- `useGetLitter(id)` и `useGetLitterPuppies(id)` (`src/actions/litter.ts`) — уже реализованы.
  `useGetLitterPuppies` бьёт в отдельный бэкенд-эндпоинт `endpoints.litter.puppies(id)`,
  возвращает `IDogItem[]`.
- `DogCardGrid` + `DogCard` (`src/sections/dog/`) — переиспользуемая адаптивная сетка карточек
  собак; `DogCard` уже линкуется на `paths.showcase.dog(id)`.
- `IDogItem.litter_id` существует; щенок = собака с данным `litter_id`.
- Публичные роуты живут под `MainLayout` (см. `src/app/kennels/layout.tsx`).

## Изменения

### 1. Path
`src/routes/paths.ts` — в блок `showcase` добавить:
```ts
litter: (id: string) => `/litters/${id}`,
```

### 2. Роут App Router
- `src/app/litters/layout.tsx` — обёртка `MainLayout` (копия `src/app/kennels/layout.tsx`).
- `src/app/litters/[id]/page.tsx` — `params: Promise<{ id }>`, `await params`, рендерит
  `<LitterDetailView id={id} />`. `metadata.title = 'Помёт - ${CONFIG.appName}'`.

### 3. `LitterDetailView`
`src/sections/litter/view/litter-detail-view.tsx` (+ экспорт из `src/sections/litter/view/index.ts`,
если файл есть; иначе импорт напрямую):
- Данные: `useGetLitter(id)`, `useGetLitterPuppies(id)`, `useGetBreeds()` (для имени породы).
- Состояния: `litterLoading` → `LoadingScreen`; нет помёта → текст «не найдено».
- Шапка-карточка с инфо о помёте (разметка переиспользуется из `KennelLitterCard`):
  порода (заголовок), статус (`Label`), дата рождения, кол-во щенков (♂/♀), цена,
  родители — ссылки на `paths.showcase.dog`, описание.
- Секция «Щенки»: `puppiesLoading` → `LoadingScreen`; пусто → `EmptyContent`; иначе
  `DogCardGrid puppies` + `breedNameById`.
- i18n: namespace `['litter', 'common']` (RU+EN). Ключи добавить в `src/locales/.../litter.json`.

### 4. Кликабельность `KennelLitterCard`
- **Вся карточка** — ссылка на `paths.showcase.litter(litter.id)`: на `Card` навесить
  `component={RouterLink}`, `href`, hover-стиль (cursor/elevation).
- Ссылки на родителей (♂/♀) — внутри кликабельной карточки нельзя оставлять `<a>` внутри `<a>`.
  Переделать в элементы с `onClick` + `stopPropagation`, навигация через `useRouter().push`
  (либо `Link` с `onClick=e.stopPropagation()` — но вложенный `<a>` невалиден, поэтому
  предпочесть кнопкоподобный элемент со `stopPropagation` и программной навигацией).

## i18n ключи (RU / EN), namespace `litter`

- `page.title` — «Помёт» / «Litter»
- `page.puppies` — «Щенки» / «Puppies»
- `page.puppiesEmpty` — «Щенков пока нет» / «No puppies yet»
- `page.notFound` — «Помёт не найден» / «Litter not found»

(Поля карточки помёта — born/puppies/price/status — переиспользуют существующие ключи
из `kennel`/`common`, либо дублируются в `litter` при необходимости.)

## Гейты (обязательно зелёные перед коммитом)
- `npx tsc --noEmit` → 0 ошибок
- `npm run lint` → 0 ошибок (`npx eslint --fix` для сортировки импортов)
- `npm test` → зелёно

## Out of scope (YAGNI)
- Редактирование помёта/щенков с публичной страницы.
- Хлебные крошки/пагинация щенков (помёты небольшие).
- Привязка щенков к помёту (создание) — отдельная задача.
