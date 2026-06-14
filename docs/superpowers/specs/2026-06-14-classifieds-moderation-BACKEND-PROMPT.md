# Backend prompt — classified moderation gate

Copy everything below the line into a fresh session opened in the **backend** repo
`E:\Coding\python-animal-platform`.

---

Реализуй модерацию объявлений (classifieds). Сейчас `POST /classifieds` создаёт объявление сразу
со статусом `active` (дефолт модели `ClassifiedStatus.active`) — гейта модерации нет, очередь
`GET /admin/moderation/classifieds` (фильтрует `status=moderation`) всегда пустая. Нужно, чтобы
объявления от не-админов уходили на модерацию, а админ их одобрял/отклонял.

## Требуемый флоу статусов

- Создание не-админом → `moderation`. Создание админом → `active`.
- Админ-решение (`PUT /admin/moderation/classifieds/{id}`): approve → `active`, reject → `closed`
  — **уже работает, не трогай**.
- Автор сам: `active`/`moderation` → `closed` (снять); `closed` → `moderation` (переотправить).
  Напрямую в `active` — только админ.
- Автор правит объявление в статусе `active` → автоматически возвращается в `moderation` (любая
  правка контента). Правка `closed` оставляет `closed`; правка `moderation` оставляет `moderation`.
- Витрина/поиск/публичный список — только `active` (как сейчас).

## Конкретные правки

### 1. Дефолт статуса при создании — `app/services/classified.py`, `create_classified`

Сейчас сигнатура `create_classified(db, author_id, fields)` и `repo.create_classified` берёт дефолт
модели (`active`). Нужно: для не-админа выставлять `moderation`, для админа — `active`.

- Прокинь признак админа в сервис (например `is_admin: bool` параметром, как уже сделано для
  `_verify_files_owned`/`update`). В роутере `create_classified` (`app/routers/classifieds.py`)
  определи `is_admin` из ролей `user` тем же способом, что и в остальных хендлерах.
- В сервисе перед `repo.create_classified(...)` положи в `fields` явный статус:
  `fields["status"] = ClassifiedStatus.active if is_admin else ClassifiedStatus.moderation`.
- Убедись, что `repo.create_classified(db, **fields)` принимает `status` (он делает
  `Classified(**fields)` — ок, поле есть в модели).

### 2. Пользовательские переходы — `_USER_STATUS_TRANSITIONS` в `app/services/classified.py`

Сейчас:
```python
_USER_STATUS_TRANSITIONS = {
    ClassifiedStatus.active: {ClassifiedStatus.closed},
    ClassifiedStatus.closed: {ClassifiedStatus.active},
    ClassifiedStatus.moderation: set(),
    ClassifiedStatus.archived: set(),
}
```
Сделай:
```python
_USER_STATUS_TRANSITIONS = {
    ClassifiedStatus.active: {ClassifiedStatus.closed},
    ClassifiedStatus.closed: {ClassifiedStatus.moderation},   # переотправка → модерация, не сразу active
    ClassifiedStatus.moderation: {ClassifiedStatus.closed},   # автор может снять объявление с модерации
    ClassifiedStatus.archived: set(),
}
```
Админ-bypass и no-op при `old == new` оставь как есть. Обнови комментарий над картой
(теперь автор управляет `active↔closed` и `closed→moderation`, в `active` переводит только админ).

### 3. Ре-модерация при правке — `update_classified` в `app/services/classified.py`

Когда **не-админ** обновляет объявление, которое сейчас в статусе `active`, и в этом же запросе НЕ
переводит его явно в `closed`, — после применения правок выставь `status = moderation` и залогируй
в `moderation_logs` (по аналогии с `_log_action` в `app/services/moderation.py`:
`action="classified.resubmit"`, `target_type="classified"`, `extra={"prev_status": "active",
"new_status": "moderation"}`; `actor_id = requester_id`).

Порядок важен: сначала отработай явный пользовательский переход статуса (валидация по карте выше),
и только если по итогу объявление осталось бы `active` после контентной правки не-админом — переведи
в `moderation`. То есть явный withdraw (`active → closed`) имеет приоритет и в модерацию не уходит.

Если в `update_classified` сейчас нет `is_admin`/`requester_id` — он уже там есть для
`_check_owner`/`_validate_status_transition`; переиспользуй.

### 4. Тесты

Прогони существующий бэкенд-сьют и обнови/добавь покрытие:
- create не-админом → `status == moderation`; create админом → `active`.
- переходы: `closed → moderation` (ок для автора), `moderation → closed` (ок), `closed → active`
  автором — запрещён (`status_transition_forbidden`), админом — ок.
- ре-модерация: автор правит `active` без смены статуса → становится `moderation` (+ запись в
  `moderation_logs`); автор правит `active` со `status=closed` → остаётся `closed` (без ре-модерации).
- `GET /admin/moderation/classifieds` после create не-админом возвращает это объявление.
- публичный `GET /classifieds` НЕ показывает `moderation`.

## Проверка флоу руками (бэкенд + фронт подняты)

```
POST /classifieds (не-админ)            → ожидаем status=moderation
GET  /classifieds/mine (автор)          → объявление видно (moderation)
GET  /classifieds                       → объявления НЕ видно
PUT  /admin/moderation/classifieds/{id} {approve:true}  → status=active
GET  /classifieds                       → теперь видно
```

## Замечания

- Не ломай контракты ответов (схемы `ClassifiedRead`/`ClassifiedModerationItem`).
- Гейты бэкенда (lint/typecheck/pytest) должны быть зелёными перед коммитом.
- Фронтенд уже готов к обоим вариантам: тост и тумблер публикации выводятся из реального `status`
  в ответе, отдельной синхронизации не требуется. Полный e2e на фронте (`e2e/classifieds.spec.ts`)
  авто-активирует проверки модерации, как только create начнёт отдавать `moderation`.
