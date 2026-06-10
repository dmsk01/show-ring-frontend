# Дизайн: ownership-aware права на собак + страница «Мои собаки»

**Дата:** 2026-06-10
**Статус:** утверждён

## Контекст

Бэкенд (ревью 2026-06-10, коммиты `fa0862a` + `49af3c8`) перевёл модель владения
собакой на `Dog.owner_id`:

- создать собаку может **любой авторизованный** (`owner_id = создатель`);
- update / delete / фото доступны владельцу по `owner_id` ИЛИ владельцу
  питомника ИЛИ admin (`_can_manage_dog`);
- `GET /users/me/dogs` отдаёт собак текущего пользователя
  (`{items,total,page,per_page}`, поддерживает `page`/`per_page`).

Фронт отстал от этой модели:

- кнопка «Редактировать» на детали собаки видна всем, кто видит страницу,
  а гард `dogs:edit` на роуте отшибает buyer'а уже после клика;
- `/dashboard/dogs/new` под `dogs:create` (только breeder/admin) — CTA
  «Добавить собаку» при записи на выставку ведёт buyer'а в тупик;
- пункт «Мои собаки» в account drawer виден только при полном праве `dogs`
  и ведёт на **общий** список собак;
- страницы «Мои собаки» (по `/users/me/dogs`) нет — хук `useGetMyDogs`
  используется только в записи на выставку.

## Решения (утверждены)

1. **Объём — полный**: ownership-aware кнопки + создание собак всеми ролями +
   отдельная страница «Мои собаки».
2. **`dogs:create` — всем ролям** (judge, buyer, organizer, operator; у
   breeder/admin уже есть через `dogs`/`*`) — зеркало бэкенда.
3. **«Мои собаки» — отдельная страница** `/dashboard/my-dogs` по паттерну
   my-shows, с переиспользованием компонентов dog-среза.

## Дизайн

### 1. Хелпер прав (чистая логика)

`canManageDog` в `src/sections/dog/dog-utils.ts`:

```ts
canManageDog(
  dog: Pick<IDogItem, 'owner_id'>,
  userId: string | null | undefined,
  can: (perm: string) => boolean
): boolean
// = can('dogs:edit') || (!!userId && dog.owner_id === userId)
```

Зеркало бэкендовского `_can_manage_dog` с упрощением: ветка «владелец
питомника» на фронте покрыта `dogs:edit` (breeder), бэкенд всё равно
перепроверяет. `owner_id: null` (легаси-собаки) → доступ только по пермиссии.

### 2. Матрица прав (`src/config/permissions.ts`)

`dogs:create` добавить в массивы organizer, judge, buyer, operator.

### 3. Ownership-aware UI

- **`dog-detail-view`**: кнопка «Редактировать» рендерится только при
  `canManageDog(dog, user?.id, can)`.
- **`dog-list-view` / `DogTableRow`**: пункт «Редактировать» в меню строки —
  по тому же условию (проп `canEdit` в строку; решение принимает вьюха).
- **`/dashboard/dogs/[id]/edit`**: статический `PermissionGuard dogs:edit`
  убрать (роут — под auth dashboard-layout'а, без PermissionGuard); проверка —
  во вьюхе после загрузки собаки: не `canManageDog` → `EmptyContent`
  «нет доступа», формы не рендерим. Причина: гард на роуте не знает владельца;
  `dogs:view` не годится — его нет у operator.
- **`/dashboard/dogs/new`**: гард `dogs:create` остаётся — теперь пропускает
  все роли. CTA «Добавить собаку» в `show-register-view` перестаёт быть
  тупиком без правок.

### 4. Страница «Мои собаки»

- `paths.dashboard.myDogs.root = '/dashboard/my-dogs'`.
- Роут `src/app/dashboard/my-dogs/page.tsx` — **без** PermissionGuard
  (личный раздел, как профиль; бэкенду достаточно auth).
- Вьюха `src/sections/dog/view/my-dogs-view.tsx`:
  - данные — `useGetMyDogs` (расширить хук параметрами `page`/`per_page`,
    пагинация через `useTable` + `TablePaginationCustom`);
  - таблица переиспользует `DogTableRow`/`TableHeadCustom` из dog-среза;
  - фильтров нет (эндпоинт их не поддерживает);
  - CTA «Добавить собаку» → `/dashboard/dogs/new`;
  - empty state «У вас пока нет собак» (`EmptyContent`);
  - в строках `canEdit = true` (это мои собаки) — но хелпер всё равно
    прогоняем, на случай легаси-строк с `owner_id: null`.
- Drawer (`src/layouts/account/account-nav.ts`): запись `dogs` в `MY_OBJECTS`
  перенацелить на `/dashboard/my-dogs`, пермиссию `dogs` → `dogs:create`
  (есть у всех — пункт виден каждой роли). Комментарий «только владельцам»
  актуализировать.

### 5. Тесты (vitest, чистая логика)

- `canManageDog`: владелец; не-владелец; `dogs:edit` перекрывает; `*` (admin);
  `owner_id: null`; `userId` undefined.
- `getMyObjectLinks`: dogs виден при `dogs:create`, href — my-dogs.
- Актуализация `src/config/__tests__/permissions.test.ts` под новую матрицу.

### 6. i18n (RU + EN)

Ключи страницы my-dogs в namespace `dog` (`myDogs.title`, `myDogs.empty`, …);
`account:drawer.myDogs` уже существует.

## Сознательно вне объёма

- Редирект после создания собаки остаётся на общий список `/dashboard/dogs`
  (buyer из flow записи на выставку попадёт туда же; права на просмотр у него
  есть). Отдельный UX-проход по flow «создал → вернись к записи» — потом.
- Фото-операции внутри edit-формы отдельно не гейтим — доступ решён на уровне
  страницы.
- Удаление собаки с UI (если появится) — использует тот же `canManageDog`.
