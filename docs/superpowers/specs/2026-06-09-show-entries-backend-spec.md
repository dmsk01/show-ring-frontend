# Backend spec — «Мои собаки» + запись на выставку (ShowTail)

> Репозиторий: `E:\Coding\python-animal-platform` (FastAPI).
> Этот документ — задание для отдельной сессии, которая правит бэкенд.
> Фронт (`show-ring-frontend`) уже реализован под контракт ниже. Сверяйся с `:8000/openapi.json`.

## Зачем

На публичной карточке выставки добавлена кнопка «Записаться». Авторизованный
пользователь попадает на форму записи `/shows/{id}/register`, где выбирает **свою**
собаку и доступный класс. Проблема: сейчас у собаки **нет владельца** в API.

`Dog` связан с владельцем только через `kennel.owner_id`, а у собак без питомника
(`kennel_id IS NULL`) владелец нигде не сохраняется — `create_dog` для таких собак
не пишет `requester_id`. Поэтому надёжно отдать «собак этого пользователя» нельзя.

## Что сделать

### 1. Поле `owner_id` у собаки

- Добавить в модель `Dog` (`app/models/dog.py`) колонку:
  - `owner_id: Mapped[uuid.UUID | None]`, FK `users.id`, `ondelete="SET NULL"`,
    `nullable=True`, `index=True`.
  - Семантика: пользователь, добавивший собаку (владелец карточки). Nullable —
    для легаси-данных, которые не удалось сопоставить.
- `relationship` на `User` по желанию (для запросов достаточно колонки).

### 2. Миграция Alembic + бэкафилл

- Новая ревизия: `ADD COLUMN owner_id`.
- Бэкафилл из питомника (где он есть):
  ```sql
  UPDATE dogs
  SET owner_id = kennels.owner_id
  FROM kennels
  WHERE dogs.kennel_id = kennels.id
    AND dogs.owner_id IS NULL;
  ```
- Собаки без питомника остаются с `owner_id IS NULL` (исторически у них нет владельца).

### 3. Проставление владельца при создании

- В `app/services/dog.py::create_dog` записывать `owner_id = requester_id`
  **независимо** от наличия `kennel_id`.
- Проверка `_check_kennel_owner` остаётся как есть (если указан `kennel_id`, он
  должен принадлежать пользователю либо это admin).

### 4. Отдать `owner_id` в ответе

- Добавить `owner_id: uuid.UUID | None` в `DogResponse` (и в `_dog_response`).
  Фронт использует поле, чтобы прятать кнопки «изменить» у чужих собак и т.п.

### 5. Эндпоинт «мои собаки»

- Новый маршрут: **`GET /users/me/dogs`** (auth required, bearer).
  - Возвращает `DogPage` (та же плоская обёртка `{items,total,page,per_page}`,
    что у `GET /dogs`).
  - Фильтрует `Dog.owner_id == current_user.id`.
  - Поддержать пагинацию `page`/`per_page` (значения по умолчанию как у `/dogs`:
    `page=1`, `per_page` 50–200). Остальные фильтры (search/breed/…) — опционально,
    фронту сейчас не требуются.
  - Сортировка по `name asc` по умолчанию.

> Почему отдельный путь, а не `GET /dogs?mine=true`: `/dogs` публичный (без auth),
> а `mine` требует пользователя. Отдельный маршрут под `/users/me/...` избегает
> опциональной авторизации и коллизии с `/dogs/{dog_id}`.

### 6. (Проверка) запись на выставку

Эндпоинты уже существуют — менять контракт не нужно, но **подтвердить поведение**:

- `POST /shows/{show_id}/entries` — body `ShowEntryCreate {dog_id, show_class_id,
  handler_id?, notes?}` → `201 ShowEntryResponse`.
  - Желательно валидировать, что `dog_id` принадлежит `current_user`
    (`dog.owner_id == user.id`) либо пользователь — handler/organizer/admin.
    Если такой проверки нет — добавить (иначе можно записать чужую собаку).
  - Ошибки бизнес-правил (регистрация закрыта, дедлайн прошёл, дубль записи,
    класс не подходит по возрасту) — возвращать `4xx` с понятным `detail`
    (фронт показывает `detail` тостом).
- `GET /shows/{show_id}/entries/my` — `ShowEntryResponse[]` (записи текущего юзера
  на эту выставку). Используется, чтобы не плодить дубли.
- `GET /shows/{show_id}/available-classes/{dog_id}` — `AvailableClassesResponse`
  (классы, доступные собаке по возрасту на дату выставки).

## Контракт, на который опирается фронт (итог)

| Метод | Путь | Auth | Ответ |
|------|------|------|-------|
| GET  | `/users/me/dogs` | да | `DogPage` (новый) |
| GET  | `/shows/{id}/entries/my` | да | `ShowEntryResponse[]` |
| GET  | `/shows/{id}/available-classes/{dog_id}` | да | `AvailableClassesResponse` |
| POST | `/shows/{id}/entries` | да | `201 ShowEntryResponse` |

`DogResponse` дополнительно содержит `owner_id: uuid | null`.

## Приёмка

- `GET /users/me/dogs` под токеном возвращает только собак этого пользователя
  (включая собак без питомника, созданных после правки).
- Старые собаки в питомниках пользователя видны после бэкафилла.
- `POST .../entries` чужой собакой — отклоняется.
- `openapi.json` отражает новый маршрут и поле `owner_id`.
