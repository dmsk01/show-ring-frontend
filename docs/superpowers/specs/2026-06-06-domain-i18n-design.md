# Интернационализация доменных секций (RU + EN)

**Дата:** 2026-06-06
**Статус:** дизайн утверждён, готов к плану реализации

## Проблема

Наши доменные секции ShowTail (`dog, kennel, litter, show, classified, ad, blog,
support, notification, profile, account, admin`) сейчас **полностью на хардкоде
по-английски**: `useTranslate` в них не используется, строки (`"Dogs"`, `"Add dog"`,
`"Name"`, `"Breed"`, сообщения zod-валидации, тосты) зашиты прямо в JSX/схемах.
i18n-инфраструктура шаблона (i18next + `resourcesToBackend`, namespaces `common /
messages / navbar`, хук `useTranslate`, переключатель языка) существует, но к нашему
домену не подключена.

## Цель

Провести полную key-based интернационализацию всех наших доменных секций: обернуть
пользовательские строки в `t()`, завести JSON-ресурсы **RU + EN** по namespace на
домен, сделать **русский языком по умолчанию**, перевести наши пункты бокового меню
и breadcrumbs. Демо-секции/страницы Minimal и лендинг — вне охвата.

## Решения (утверждены)

- **Подход:** полный key-based i18n, ресурсы RU + EN (по CLAUDE.md «Локали: только
  RU + EN»).
- **Язык по умолчанию:** русский.
- **Охват:** все наши домены (см. список ниже) + боковое меню (раздел ShowTail) +
  breadcrumbs.

## Архитектура ресурсов

Расширяем `src/locales/langs/{ru,en}/*.json`. Lazy-load уже работает через
`resourcesToBackend` (`locales-config.ts`): `import('./langs/${lang}/${namespace}.json')`.

Namespaces:

- **`common.json`** (расширить) — сквозное: действия (`save/cancel/delete/edit/
  create/back/search`), общие колонки таблиц (`name/status/actions/createdAt`),
  состояния (`loading/empty/error/noData`), `ConfirmDialog`, пагинация, корни
  breadcrumbs (`dashboard`).
- **`navbar.json`** (расширить) — раздел ShowTail: `subheader` + тайтлы пунктов
  (Dogs, Kennels, Litters, Shows, Classifieds, Ads, Support, References, Users,
  Moderation, Analytics, Notifications, My profile) и общие `List/Create`.
- **По домену:** `dog`, `kennel`, `litter`, `show`, `classified`, `ad`, `blog`,
  `support`, `notification`, `profile`, `account`, `admin`. `admin` — один файл с
  вложенными ключами `reference / users / moderation / analytics`.

Единая структура ключей внутри доменного namespace:

```jsonc
{
  "list":   { "title": "...", "new": "...", "search": "...", "columns": { "name": "..." } },
  "form":   { "fields": {...}, "validation": {...}, "submit": {...} },
  "detail": { ... },
  "enums":  { "sex": { "male": "Кобель", "female": "Сука" } },
  "toast":  { "created": "...", "updated": "...", "deleted": "..." }
}
```

## Потребление в компонентах

`const { t } = useTranslate(['dog', 'common'])` — тип `Namespace` принимает массив,
оба namespace декларируются и подгружаются. Обращение:
- `t('list.title')` — из первого (доменного) namespace;
- `t('common:actions.save')` — из общего по префиксу.

## Конфиг и язык по умолчанию

- `locales-config.ts`: `fallbackLng: 'ru'`, `i18nOptions(lang = fallbackLng)`.
- Проверить `src/locales/server.ts` и куку `i18next`, чтобы SSR и первый клиентский
  рендер отдавали `ru` без мигания. EN остаётся полноценно переключаемым (поэтому
  en.json заполняем тоже).

## Навигация

- `nav-config-dashboard.tsx`: статический `export const navData` → экспорт-функция
  `navData(t)` (паттерн шаблона `sections/_examples/.../nav-config-translate.tsx`).
- `dashboard/layout.tsx` (уже `'use client'`): добавить
  `const { t } = useTranslate('navbar')` и вызвать `navData(t)`.
- Демо-разделы меню (Overview / Management / Misc) **не трогаем** — их строки
  остаются литералами внутри той же функции, без ключей.
- Breadcrumbs в каждом view: heading/links через `t('list.title')` и
  `t('common:dashboard')`.

## Сообщения валидации (zod)

Схемы переводятся с уровня модуля на фабрики, принимающие `t`:

```ts
export const getDogSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, { error: t('form.validation.nameRequired') }),
    // ...
  });
export type DogSchemaType = z.infer<ReturnType<typeof getDogSchema>>;
```

В компоненте: `const schema = useMemo(() => getDogSchema(t), [t])`. Существующие
unit-тесты на схемы (`profile-security-schema.test.ts` и пр.) переключаются на вызов
фабрики с identity-`t` (`(k) => k`) — проверяют логику, не текст.

## Декомпозиция на единицы (порядок реализации)

Каждая единица изолирована: свой namespace + свои файлы, мёржится зелёной независимо.

1. **Инфраструктура** (фундамент): `common.json`, `navbar.json` (RU+EN); смена
   `fallbackLng → ru`; перевод `nav-config-dashboard` + правка `dashboard/layout`.
   Проверка переключателя языка.
2. **Ядро ShowTail:** `dog` → `kennel` → `litter` → `show`. Для каждого: list /
   table-row / toolbar / filters-result / form / detail / public-detail /
   card-grid / utils.
3. **Витрина/контент:** `classified` → `ad` → `blog` (наши read/CRUD-части блога;
   демо-страница поста `/dashboard/post/[title]` не трогается).
4. **Сервис/аккаунт:** `support` → `notification` → `profile` → `account`.
5. **Admin:** `admin` (reference / users / moderation / analytics).

## Тесты и гейты

После каждой единицы (по CLAUDE.md):
- `npx tsc --noEmit` → 0 ошибок;
- `npm run lint` → 0 (с `npx eslint --fix <files>`, `perfectionist` сортирует импорты);
- `npm test` → зелёно (юнит-тесты схем правятся под фабрики).

## Вне охвата

- Демо-секции и страницы Minimal: `product, order, invoice, job, tour`, demo-части
  `user`, `mail, chat, kanban, calendar, file-manager`, `pricing, payment, checkout`
  и т.п.
- Лендинг (`src/sections/landing`) — самодостаточный словарь `landing/content`
  (по CLAUDE.md).
- `src/sections/_examples`.
- Реестр иконок `Iconify` (`icon-sets.ts`) — переводим только текст, иконки не
  затрагиваем.

## Риски

- Большой объём (~40+ файлов). Митигируется поэтапной сдачей по доменам — каждый
  домен зелёный и мёржится независимо.
- Возможны несовпадения backend-enum значений с UI-подписями — подписи берём из
  доменного `enums`, значения-ключи backend не меняем.
