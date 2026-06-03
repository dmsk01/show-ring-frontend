# Дизайн: доступ в ЛК из главного хедера + AccountDrawer и страницы настроек

Дата: 2026-06-04
Статус: согласовано (готово к плану)

## Проблема

Залогиненный пользователь на публичных страницах (главный layout — лендинг, витрина
шоу/питомников/собак) **не может попасть в личный кабинет**: в хедере `rightArea` всегда
рендерится `<SignInButton/>`, состояние авторизации не проверяется. Чтобы попасть в ЛК,
юзер вынужден повторно проходить флоу логина.

Дополнительно `AccountDrawer` (`src/layouts/components/account-drawer.tsx`) завязан на
`useMockedUser()` (хардкод-демо «Jaydon Frankie») и содержит демо-элементы Minimal Kit
(переключение аккаунтов, `UpgradeBlock`), а его пункты `_account` ведут на `#`.

## Цель

1. В главном хедере: залогиненный юзер видит аватарку → по клику открывается
   `AccountDrawer` → переходит в ЛК. Незалогиненный — видит «Sign in».
2. `AccountDrawer` работает на боевых данных и ведёт на наши реальные страницы.
3. Появляются страницы настроек ЛК.

## Контекст (факты из кода/бэкенда)

- `AuthProvider` обёрнут в корне `src/app/layout.tsx` → страницы главного layout уже имеют
  доступ к `useAuthContext()`.
- `GET /users/me` → `{ id, email, is_active, roles: [{role, granted_at}], ... }` —
  **без имени и без аватара**.
- `GET /users/me/profile` → `{ first_name, last_name, patronymic, country }`. Аватара в
  схеме нет; у нового юзера профиль может быть пустым.
- Готовые кирпичи для переиспользования: `AccountDrawer`, `AccountButton`, `SignInButton`,
  `account-layout.tsx` (табличный shell), `account-change-password.tsx`,
  `account-notifications.tsx`, `account-socials.tsx`, `Form/Field.*`, `UploadAvatar`
  (`src/components/upload/avatar/upload-avatar.tsx`), `LoadingScreen`
  (`src/components/loading-screen`).

## Архитектурное решение

Переключение в хедере выносим в отдельный компонент (не плодим условия в layout). Данные
профиля тянем ленивым SWR-хуком, **не раздувая bootstrap авторизации** вторым запросом.
Отвергнутая альтернатива — мерджить профиль в `user` внутри `AuthProvider`: чище на
потреблении, но добавляет обязательный запрос в старт сессии и связывает auth с профилем.

---

## Компоненты

### 1. `AccountControl` (auth-aware переключатель хедера)

Файл: `src/layouts/components/account-control.tsx`.

- Читает `loading / authenticated` из `useAuthContext()`.
- `loading` → заглушка-плейсхолдер размером с аватар (40×40, `Skeleton` variant="circular"),
  чтобы не дёргался layout.
- `authenticated` → `<AccountDrawer data={getAccountNavItems(roles, permissions)} />`.
- `unauthenticated` → `<SignInButton/>`.

Подключение:
- `src/layouts/main/layout.tsx`: строку `<SignInButton/>` заменить на `<AccountControl/>`.
  **Кнопку «Purchase» удалить** (демо-апселл Minimal, к продукту не относится).
- `src/layouts/dashboard/layout.tsx`: использовать тот же `AccountControl` (или
  `AccountDrawer` напрямую с новым data) — но т.к. в dashboard юзер всегда авторизован,
  допустимо оставить `AccountDrawer` напрямую; источник пунктов и данных — общий.

### 2. `AccountDrawer` (под наш продукт)

Файл: `src/layouts/components/account-drawer.tsx` — правки:

- `useMockedUser()` → `useAuthContext()` (email, roles) + новый хук `useMyProfile()`.
- Имя: `first_name + last_name` (trim), фолбэк → `email`. Передаётся в `AccountButton`/шапку.
- Аватар: **инициалы**. MUI `Avatar` рисует инициалы из `children`
  (`displayName?.charAt(0)`), `photoURL` не передаём. На странице профиля — `UploadAvatar`
  (принимает текстовый плейсхолдер), задизейблен с тултипом «скоро», пока на бэке нет поля
  avatar.
- **Удалить**: блок переключения аккаунтов (3 фейк-аватара `_mock` + «Add account») и
  `UpgradeBlock`. Импорты `_mock`, `useMockedUser`, `UpgradeBlock` убрать.
- Кнопку «Выход» (`SignOutButton`) оставить внизу.

### 3. Навигация drawer — `getAccountNavItems(roles, permissions)`

Файл: `src/layouts/nav-config-account.tsx` — заменить статический `_account` на функцию.

- Всегда: **Дашборд** (`paths.dashboard.root`), **Настройки профиля**
  (`paths.dashboard.account.root`).
- Role/permission-gated секция **«Мои объекты»**: Питомники / Собаки / Помёты — ведут на
  существующие списки (`paths.dashboard.kennel/dog/litter`). Показ по правам
  (через `can`/`canAny` из `src/utils/permissions.ts`); у кого прав нет — пункт не рендерится.
- «Выход» рендерится самим drawer'ом отдельно (не часть списка).

### 4. Данные профиля — `src/actions/account.ts`

SWR-action по паттерну `dog.ts`/`product.ts`:

- `useMyProfile()` → `GET /users/me/profile`, ленивый (только когда есть токен/авторизован).
- `updateMyProfile(payload)` → `PATCH /users/me/profile` + `mutate`/revalidate.
- Эндпоинты сверить с `:8000/openapi.json` на этапе плана; метод (`PUT`/`PATCH`) уточнить.

### 5. Страницы настроек ЛК — `/dashboard/account`

Новая роут-группа (демо `/dashboard/user/account` **не трогаем**):

```
src/app/dashboard/account/
  layout.tsx              -> табличный shell (копия паттерна account-layout)
  page.tsx                -> Профиль
  security/page.tsx       -> Безопасность
  notifications/page.tsx  -> Уведомления
  socials/page.tsx        -> Соцсети
  feedback/page.tsx       -> Обратная связь
```

Табы (shell на базе `account-layout.tsx`, но со своими `NAV_ITEMS` и нашими breadcrumbs):

- **Профиль** — `Form` + `Field.Text` (имя/фамилия/отчество) + `Field.CountrySelect`
  (страна), привязка к `useMyProfile`/`updateMyProfile`. Сверху `UploadAvatar` (инициалы),
  disabled + тултип «скоро».
- **Безопасность** — смена пароля на базе `account-change-password.tsx`. Эндпоинт сверить;
  если на бэке нет — оставить форму с явной пометкой-заглушкой (`toast`/disabled submit).
- **Уведомления** — на базе `account-notifications.tsx` (свитчи). Бэкенд сверить; иначе
  локальная заглушка с пометкой.
- **Соцсети** — на базе `account-socials.tsx` (ссылки на соцсети). Хранилище на бэке
  сверить (в текущей схеме профиля их нет); иначе заглушка.
- **Обратная связь** — форма (тема + текст), отправка в support-домен бэкенда (сверить
  эндпоинт); иначе заглушка с `toast.success`.

### 6. Роуты — `src/routes/paths.ts`

Добавить:
```
dashboard.account = {
  root: `${ROOTS.DASHBOARD}/account`,
  security: `${ROOTS.DASHBOARD}/account/security`,
  notifications: `${ROOTS.DASHBOARD}/account/notifications`,
  socials: `${ROOTS.DASHBOARD}/account/socials`,
  feedback: `${ROOTS.DASHBOARD}/account/feedback`,
}
```

## Состояния и edge-cases

- Профиль пустой (новый юзер) → имя = email; формы пустые, но валидные.
- `useMyProfile` грузится → в drawer показываем email и `Skeleton` для имени.
- `loading` авторизации в хедере → `Skeleton` 40×40 вместо аватара (без скачка layout).
- 401/refresh — уже обрабатывает интерсептор `src/lib/axios.ts`.
- Роли отсутствуют/пустые → «Мои объекты» не показываем, остаются Дашборд + Настройки.

## Доступность / адаптив

- `AccountButton` уже `aria-label="Account button"`; сохранить.
- Drawer — существующий `Scrollbar`, ширина 320 (как сейчас).
- Табы настроек — горизонтальный скролл на mobile (как в `account-layout`).

## Что НЕ делаем (вне объёма)

- Загрузку реального аватара (нет поля на бэке) — UI задизейблен под будущее.
- Переключение/мультиаккаунт.
- Редизайн самих списков «Мои объекты» (фильтр «только мои» — отдельная задача бэка/списков).

## Гейты качества (CLAUDE.md)

Перед коммитом — зелёные: `npx tsc --noEmit`, `npm run lint` (`eslint --fix` для импортов),
`npm test`. Иконки `Iconify` — только из реестра `src/components/iconify/icon-sets.ts`.

## Открытые вопросы к этапу плана (проверить по openapi)

1. Метод обновления профиля: `PATCH` vs `PUT /users/me/profile`.
2. Наличие эндпоинта смены пароля.
3. Наличие хранилища настроек уведомлений и соц-ссылок.
4. Эндпоинт support/обратной связи и его схема.
Чего нет на бэке — реализуем как явную заглушку, не блокируя остальную работу.
