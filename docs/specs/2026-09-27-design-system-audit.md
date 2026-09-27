# Аудит стилей фронтенда (2026-09-27)

Вход для переработки дизайн-системы в Claude Design.

Область: ~234 продуктовых `.tsx`, изменённых после импорта шаблона Minimal UI kit v7.4.
`sections/_examples` и демо-разделы шаблона не учитывались.

Вывод: код почти целиком работает через тему, проблемы системные, а не точечные.

## 1. Тема — это всё ещё шаблон Minimal

| Что | Где | Проблема |
|---|---|---|
| Палитра | `src/theme/theme-config.ts` | Дефолт Minimal: primary `#00A76F`, secondary `#8E33FF` — своего цвета нет |
| Пресеты цвета | `src/theme/with-settings/color-presets.ts` | 6 пресетов primary + 6 secondary, переключаются в Settings Drawer |
| Settings Drawer | `src/app/layout.tsx`, `src/layouts/dashboard/layout.tsx` | Доступен пользователям: меняют шрифт, цвет, контраст, раскладку навигации → единого дизайна быть не может |
| Шрифты | `src/global.css` | Грузятся 5 семейств (Public Sans, Barlow ×5 весов, DM Sans, Inter, Nunito Sans); последние три — только для Settings Drawer |
| Радиус | `src/theme/create-theme.ts` | Только `shape.borderRadius: 8`, шкалы нет |
| `classesPrefix: 'minimal'` | `theme-config.ts` | Имя шаблона |

## 2. Хардкод в продуктовом коде

### Цвета (hex почти нет)

- `src/layouts/components/notifications-drawer/icons.tsx` — ~40 hex из шаблонной палитры (`#FFAB00`, `#006C9C`, `#22C55E`…). При смене палитры иконки останутся старыми.
- `src/components/nav-section/styles/css-vars.ts` — `bulletColor` двумя hex.
- `src/sections/invoice/invoice-pdf.tsx` — `#e9ecef`, `#FFFFFF` (для PDF допустимо).
- `src/sections/home/components/*` — SVG шаблона, раздел не используется.

### Типографика

- `fontWeight: 600` вместо `fontWeightSemiBold` — 11 мест, все про «основную ячейку строки таблицы»:
  `dog-table-row`, `kennel-table-row`, `litter-table-row`, `classified-table-row`, `campaign-table-row`,
  `ticket-table-row`, `admin-user-row`, `moderation-view` (×2), `show-results-table`.
- Лендинг вручную масштабирует заголовки (`fontSize: {xs:36, md:60}`, `{xs:28, md:40}`, `fontWeight: 800`):
  `landing-hero`, `landing-section-heading`, `landing-faqs`, `landing-stats` — отдельная типографическая шкала в обход `h1/h2`.

### Радиусы

39 мест, значения `1`, `1.5`, `2`, `3`, `'50%'`. Картинки в карточках — `1.5`, блоки — `2`, в about/landing — `3`. Нужна шкала `sm/md/lg/full`.

### Тени

В основном `customShadows.z8/z16/z20`. Исключение — `about-what.tsx`, сырая тень `-40px 40px 80px`.

## 3. Непоследовательная семантика

### Статусы

7 отдельных карт `STATUS_COLOR`, одинаковые по смыслу статусы окрашены по-разному:

| Статус | Где | Цвет |
|---|---|---|
| `in_progress` | `show/show-utils.ts` | info |
| `in_progress` | `support/ticket-table-row.tsx` | **warning** |
| `completed` | `show/show-utils.ts` | default |
| `completed` | `ad/campaign-table-row.tsx` | **info** |
| `registration_closed` и `in_progress` | `show/show-utils.ts` | оба info — неразличимы |

Прочие карты: `classified-table-row`, `classified-utils` (`AVAILABILITY_COLOR`), `litter-table-row`,
`notifications-view`, `show-documents-panel`, `ticket-table-row` (`PRIORITY_COLOR`).

### Пол собаки

Цвет задан инлайном в `dog-table-row.tsx` (male → info) и `classified-card.tsx` (female → secondary).

### Иконки в карточках

- `dog-card` — цветные иконки (`info`, `primary`, `warning`);
- `kennel-card`, `classified-card` — локация `error.main`;
- `show-card`, `my-show-card` — те же иконки `text.secondary`.

### Карточки

- С фото: `dog-card`, `kennel-card`, `classified-card` — одинаковая структура (`p:1` → Image 4/3 r1.5 → ListItemText), скопирована трижды.
- Без фото: `show-card`, `my-show-card` (`p:3`), `kennel-litter-card` (`p:2.5`, `mb:1.5`). `show-card` и `my-show-card` почти идентичны; строка «иконка + текст» повторяется.

Кандидаты в компоненты: `MediaCard`, `InfoCard`, `MetaRow`.

## 4. Кнопки и Label

- Кнопки: `contained` 61, `outlined` 32, `soft` 11; размеры `small` 37, `large` 16, `medium` 1 — нет правила выбора.
- `Label`: варианты `soft` / `filled` / `outlined` / default без системы.

## 5. Мёртвый груз шаблона

- `sections/_examples` (199 файлов, 60 роутов), демо-разделы: tour, job, invoice, kanban, mail, chat, calendar, file-manager, product, checkout, order, payment, pricing — не нужно приводить к дизайну; удалить или закрыть от прода.
- `sections/home`, `address`, `product`, `showcase` не импортируются нигде.

## Задачи для Claude Design

1. Жизненный цикл статусов — единая шкала 6–7 состояний.
2. Токены: пол собаки, доступность (available / reserved / sold).
3. Шкала радиусов; одна типографическая шкала для лендинга и кабинета (адаптивные h1–h3).
4. Правило для иконок в мета-строках (нейтральные или акцентные).
5. Компоненты: `MediaCard`, `InfoCard`, `MetaRow`, основная ячейка таблицы, правила вариантов Button/Label.
6. Settings Drawer: убрать или оставить только light/dark.

## Независимые от дизайна правки

Делаются до выбора цветов, чтобы потом менять значения в одном месте:

- [x] Единый модуль семантических цветов: `src/theme/semantic.ts` (`STATUS_TONE`, `PRIORITY_TONE`, `SEX_COLOR`); все карты статусов переведены на тона.
- [x] `fontWeight: 600/500/400` → `fontWeightSemiBold/Medium/Regular` (кроме `landing-stats` 800 — ждёт шкалу лендинга).
- [x] Токены пола собаки (`SEX_COLOR`) в `dog-table-row`, `classified-card`, `dog-card`.
- [x] Иконки уведомлений — CSS-переменные палитры (`var(--palette-warning-main)` и т.д.) вместо hex.
- [x] `src/components/meta-row` — строка «иконка + текст»; мета-иконки нейтральные, акцент только у пола. Подключено в `show-card`, `my-show-card`, `dog-card`, `kennel-card`, `classified-card`.
- [x] Убраны шрифты DM Sans / Inter / Nunito Sans из `global.css` и выбор шрифта из Settings Drawer.

Изменения цвета статусов после унификации:

| Статус | Было | Стало |
|---|---|---|
| show `registration_closed` | info | warning (ожидание) |
| ticket `open` | info | warning (ждёт реакции) |
| ticket `in_progress` | warning | info (в работе) |
| campaign `completed` | info | default (завершено) |
| litter `sold_out` | warning | default (терминальное) |

Осталось на этап после дизайна: шкала радиусов, типографика лендинга, `MediaCard`/`InfoCard`,
`bulletColor` в `nav-section/styles/css-vars.ts` (не совпадает с grey-шкалой), удаление npm-пакетов шрифтов,
решение по Settings Drawer и демо-разделам шаблона.
