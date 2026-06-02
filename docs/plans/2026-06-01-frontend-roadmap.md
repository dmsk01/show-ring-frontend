# Show Ring Frontend — Roadmap (что реализовать дальше)

**Дата:** 2026-06-01
**Контекст:** фронтенд (Minimal Kit / Next.js 16 / MUI 7) подключён к бэкенду ShowTail (FastAPI, ~18 доменов, ~120 эндпоинтов). Сейчас реализованы: слой-фундамент (прокси `/api`, реальный JWT-auth с refresh, RBAC под 6 ролей), **домен Dogs** (первый вертикальный срез), **лендинг** на `/` (RU/EN). Остальные домены — пока демо-страницы Minimal.

**Базовый рецепт для каждого домена** (из `docs/superpowers/specs/2026-06-01-showtail-frontend-integration-design.md`): `типы → SWR-actions (src/actions) → секции (src/sections) → роуты App Router + навигация → RBAC-гейтинг`. Каждый домен оформляется отдельной spec+plan (skills `brainstorming` → `writing-plans`) перед реализацией.

---

## Сделано
- Фундамент: `next.config` rewrites `/api/*`→`:8000`; `src/lib/axios` (bearer + single-flight 401-refresh); JWT (`/auth/login`, `/users/me`, `/auth/refresh`, `/auth/logout`); RBAC (`src/config|utils|hooks` + `PermissionGuard`) под роли `admin, organizer, breeder, judge, buyer, operator` с union прав по мульти-роли.
- **Dogs**: список (серверная пагинация+фильтры), создание/редактирование, детальная (инфо+титулы), RBAC-гарды.
- **Лендинг** `/`: 7 секций, RU/EN через общий `LanguagePopover` в шапке, трафарет-декор, SEO-блок.
- Локали приложения сокращены до RU+EN.

---

## Фаза 1 — Базовые сущности (фундамент для всего)
**Цель:** закрыть справочники, питомники, помёты и профиль — без них формы Dogs/Shows неполноценны.

1. **Files / загрузки (MinIO)** — `POST /files/upload`, `GET /files/{id}`, варианты. Переиспользуемый upload-компонент (есть `Field.Upload`/`file-manager`). **Разблокирует:** фото собак, изображения объявлений, логотипы питомников.
2. **References + Admin-references** — `GET /references/{breeds,breed-groups,animal-types,grades,show-classes,show-ranks,titles}` (+ admin CRUD `POST/PUT/DELETE /admin/references/*`). Справочные хуки + админ-таблицы. **Разблокирует:** автокомплиты в Dogs/Shows.
3. **Dogs follow-ups** (долги из ревью): автокомплит породы из `/references/breeds`, выбор питомника, выбор родителей (father/mother), вкладка родословной (`/dogs/{id}/pedigree`), загрузка фото.
4. **Kennels (питомники)** — `GET/POST/PUT/DELETE /kennels`, профиль, верификация. Связь dog↔kennel.
5. **Litters (помёты)** — `GET/POST/PUT /litters`.
6. **Users / Profile** — `GET/PUT /users/me`, `GET/PATCH /users/me/profile` (страница account на реальные данные), `GET /users/{id}`.

**Definition of done фазы:** заводчик может вести питомник, собак (с фото/родословной) и помёты; справочники доступны и редактируются админом.

## Фаза 2 — Витрина и поиск
- **Classifieds (объявления)** — `GET /classifieds`, `/classifieds/search`, `POST/PUT/DELETE`, `POST /classifieds/{id}/images`. Список с фильтрами, карточка, создание, загрузка фото. Модерация — в админке (фаза 5).

## Фаза 3 — Выставки (ядро платформы, самый большой объём)
- **Shows — управление:** `POST/GET/PUT /shows`, `status`/`publish`, ринги (`/shows/{id}/rings`), судьи (`/shows/{id}/judges`), регистрация (`/shows/{id}/entries`, `/entries/my`), выбор класса (`/available-classes/{dog_id}`).
- **Results — проведение:** `POST/GET /shows/{id}/results`, `best-in-group|show|breed`, `by-breed/{breed_id}`, `by-ring`, правки результатов. Судейский интерфейс (роль `judge`).
- **Documents:** `catalog`, `diplomas`, `certificates`, `ring-sheets`, `readiness` — генерация через очередь (`POST /tasks/send`, `GET /tasks/{id}`, `/download`, статусы). UI генерации + поллинг задачи + скачивание PDF.

**Зависит от** фазы 1 (references, dogs, kennels).

## Фаза 4 — Монетизация и сервис
- **Ads:** `GET/POST/PUT /ads/campaigns`, баннеры, `stats`/`stats/daily`, `serve`, `events`. Кабинет рекламодателя (роль из RBAC).
- **Support:** `GET/POST /support/tickets`, сообщения, `assign`, `status` (+ `support/admin/tickets`). Можно переиспользовать демо `chat`/`mail` как основу.
- **Notifications + Subscriptions:** `GET /notifications`, `GET/POST/DELETE /subscriptions`. Колокольчик в шапке + страница подписок.

## Фаза 5 — Админка и аналитика
- **Admin analytics:** `GET /admin/analytics/{dashboard,ads,top-breeds,top-campaigns,shows/{id}/report,shows/{id}/revenue}` — дашборды (переиспользовать `dashboard/analytics`).
- **Moderation:** `GET/PUT /admin/moderation/{classifieds,kennels/verify}`.
- **Users admin:** `GET /admin/users`, `PUT /admin/users/{id}/{block,role}`.

---

## Сквозные задачи / технический долг (параллельно фазам)
- **Чистка демо Minimal** (приоритет — ближайшая): удалить неиспользуемые demo-роуты/секции/actions (`ecommerce, banking, booking, course, tour, job, post/blog, invoice, order, product, file-manager` и showcase `components/*`). **Это чинит падение `npm run build`** на SSR-демо `/dashboard/post/[title]` (серверный fetch против относительного `/api`). Вести инвентаризацию «оставить/удалить» (см. spec §4); `analytics`, `chat`, `calendar`, `kanban` припарковать под будущие домены.
- **Failed-refresh → redirect** (долг ревью): при неуспешном refresh во время in-app запроса делать редирект на `/auth/jwt/sign-in` (сейчас сессия чистится, но переход — только на следующей навигации).
- **Очистка `axios.defaults` Authorization** в `setSession` (дублирует request-интерсептор) — мелкий долг.
- **RBAC-матрица:** уточнять права ролей в `src/config/permissions.ts` по мере появления доменов (сейчас стартовая).
- **Тесты:** расширять vitest на чистую логику новых доменов; позже — рассмотреть e2e (Playwright) для ключевых флоу (логин, заявка на выставку).
- **i18n:** при необходимости вынести лендинг/домены в общий словарь; сейчас RU/EN.

### Доработки уведомлений (после привязки NotificationsDrawer к `/notifications`)
- **Mark-as-read** ✅ Бэкенд отдаёт `is_read`/`read_at` и `PATCH /notifications/{id}/read` (идемпотентно); drawer и список читают `is_read`, клик по непрочитанному помечает прочитанным (оптимистично, с откатом). Опционально (ждёт согласования): `PATCH /notifications/read-all` для кнопки «прочитать всё» и `GET /notifications/unread-count` для бейджа независимо от пагинации.
- **Иконки по типу события**: все элементы drawer сейчас под иконкой `mail`; завести маппинг `event_type → иконка` (registration/results/litter/title) в `notifications-drawer/icons.tsx`.
- **Deep-link уведомления**: клик ведёт на связанную сущность (show/litter/dog) — когда бэкенд добавит идентификатор/ссылку в payload.

### Прогресс
- **Phase 1 ✅** References · Dogs (breed/kennel/parents) · Kennels (+avatar/Files) · Litters · Profile.
- **Phase 2 ✅** Classifieds.
- **Phase 3 ✅** Shows · Results · Documents.
- **Phase 4 ✅** Ads · Support · Notifications (+ NotificationsDrawer на реальных данных).
- **Phase 5 (в работе)** Admin Users ✅ · Moderation ✅ · Analytics ✅ · **чистка демо — следующее**.

---

## Рекомендация по следующему шагу
Начать с **Фазы 1**, в порядке: **Files → References → Dogs follow-ups → Kennels → Litters → Profile**. Это разблокирует полноценный Dogs и подготавливает Shows. Параллельно — **чистка демо** (снимает блок на production-сборку). Каждый домен — отдельной spec+plan по базовому рецепту.
