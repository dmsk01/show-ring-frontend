# ТЗ (бэкенд): фильтр объявлений по полу животного

**Дата:** 2026-06-08
**Репозиторий бэкенда:** `E:\Coding\python-animal-platform` (ShowTail, FastAPI)
**Связанный фронт:** страница `/animals` → `ClassifiedShowcaseView`
(`src/sections/classified/view/classified-showcase-view.tsx`).

## Контекст
На странице поиска животных добавлены фильтры **порода**, **пол**, **диапазон цен**.
Порода (`breed_id`) и цена (`price_from`/`price_to`) уже поддержаны бэкендом —
работают сразу. **Пол не поддержан**: у модели `Classified` нет поля пола, а
эндпоинт `GET /classifieds` не принимает такой параметр.

Фронт уже отправляет параметр `sex=male|female` в запрос списка. Сейчас FastAPI
молча игнорирует неизвестный query-параметр, поэтому фильтр пола визуально
присутствует, но не влияет на выдачу, пока не выполнена эта доработка.

## Что нужно сделать

### 1. Модель — `app/models/classified.py`
Добавить необязательное поле пола животного:
```python
sex: Mapped[AnimalSex | None] = mapped_column(
    Enum(AnimalSex, name="animal_sex"), nullable=True
)
```
Значения enum — `male` / `female` (переиспользовать существующий enum пола
животного, если он уже есть в проекте; иначе завести `AnimalSex`). Поле
nullable: для категорий вроде `grooming`/`handler` пол неприменим.

### 2. Миграция (Alembic)
Новая ревизия: добавить колонку `sex` (nullable) в таблицу объявлений
(+ тип `animal_sex`, если создаётся новый enum). Бэкофилл не требуется — старые
записи остаются с `NULL`.

### 3. Схемы — `app/schemas/classified.py`
- `ClassifiedCreate` / `ClassifiedUpdate`: добавить `sex: AnimalSex | None = None`.
- `ClassifiedResponse`: вернуть `sex` в ответе.

### 4. Эндпоинт списка — `app/routers/classifieds.py::list_classifieds`
Добавить query-параметр и пробросить в репозиторий (в `list_classifieds`
и `count_classifieds`):
```python
sex: AnimalSex | None = Query(None),
```

### 5. Репозиторий — `app/repositories/classified.py`
В сборку фильтров (`_apply_filters` / общий билдер `where`) добавить:
```python
if sex is not None:
    stmt = stmt.where(Classified.sex == sex)
```
Применить и к выборке, и к `count`.

## Контракт API (после доработки)
- `GET /classifieds?sex=male` → только объявления с `sex == male`.
- `GET /classifieds?sex=female` → только `female`.
- Без параметра `sex` → поведение прежнее (все, включая `NULL`).
- Значение должно комбинироваться с уже существующими `breed_id`,
  `price_from`, `price_to`, `category`, `city`.

## Приёмка
- Swagger `:8000/docs`: у `GET /classifieds` появился параметр `sex` (enum male/female).
- `GET /classifieds?sex=male` и `?sex=female` отдают корректно отфильтрованные списки.
- `total` в `ClassifiedPage` согласован с фильтром по полу.

## На стороне фронта (после готовности бэкенда)
Доп. работа не требуется для фильтрации (параметр уже шлётся). Опционально:
показывать пол на карточке/в деталях объявления, если `sex` теперь в ответе —
отдельная мелкая задача.
