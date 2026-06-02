# ТЗ для бэкенда ShowTail — домен Blog (Posts)

**Дата:** 2026-06-02
**Зачем:** на фронте раздел Blog уже собран на готовых компонентах Minimal Kit
(`src/sections/blog/**`) и переведён на клиентский рендер через SWR
(`src/actions/blog.ts`). Нужны реальные эндпоинты бэкенда, чтобы фронт заработал
**без доработок UI** — только подключение данных.

Все пути даны как видит их бэкенд. Фронт ходит на `/api/*`, Next-прокси
форвардит на бэкенд (`/api/posts` → `:8000/posts`). Формат ответа — **строго**
как описано ниже (фронт ждёт именно эти ключи-обёртки).

---

## Модель ответа: `Post` (== `IPostItem` на фронте)

```jsonc
{
  "id": "string",
  "title": "string",              // человекочитаемый заголовок
  "slug": "string",               // URL-safe, kebab-case; по нему идёт поиск (см. ниже)
  "description": "string",        // короткое описание
  "content": "string",            // HTML тела поста (см. «Контент = HTML» ниже)
  "coverUrl": "string",           // URL обложки (можно отдать /api/files/{id})
  "tags": ["string"],
  "publish": "published",         // "published" | "draft"
  "metaTitle": "string",
  "metaDescription": "string",
  "metaKeywords": ["string"],
  "totalViews": 0,
  "totalShares": 0,
  "totalComments": 0,
  "totalFavorites": 0,
  "createdAt": "2026-06-02T10:00:00Z",  // ISO 8601
  "author":  { "name": "string", "avatarUrl": "string" },
  "favoritePerson": [ { "name": "string", "avatarUrl": "string" } ],
  "comments": [
    {
      "id": "string",
      "name": "string",
      "avatarUrl": "string",
      "message": "string",
      "postedAt": "2026-06-02T10:00:00Z",
      "users": [ { "id": "string", "name": "string", "avatarUrl": "string" } ],
      "replyComment": [
        { "id": "string", "userId": "string", "message": "string",
          "tagUser": "string", "postedAt": "2026-06-02T10:00:00Z" }
      ]
    }
  ]
}
```

Поля `author`, `favoritePerson`, `comments`, `tags`, `metaKeywords` не должны быть
`null` — отдавай пустыми объектами/массивами. `total*` — числа (0 по умолчанию).

> **Slug-идентификация.** В URL фронта пост адресуется slug'ом
> (`/dashboard/post/<slug>/edit`, `/post/<slug>`). Detail/latest ищут пост по
> `?title=<slug>`. Поэтому: храни `slug` (kebab-case от заголовка, уникальный) и
> матчь lookup по `slug`. Имя query-параметра исторически `title`, но значение —
> это slug; матчинг делай по slug (а не по человекочитаемому заголовку).

---

## Read-эндпоинты (публичные, без авторизации — нужны для лендинга `/post`)

| Метод/путь | Query | Ответ |
|---|---|---|
| `GET /posts` | `?publish=published` (опц.) | `{ "posts": Post[] }` |
| `GET /posts/detail` | `?title=<slug>` | `{ "post": Post }` · 404 если нет |
| `GET /posts/latest` | `?title=<slug>` | `{ "latestPosts": Post[] }` — последние посты, **исключая** указанный slug |
| `GET /posts/search` | `?query=<строка>` | `{ "results": Post[] }` — поиск по title/description/tags |

Для списков допускается урезанная карточка (без `content`/`comments`), но
ключевые поля карточки обязательны: `id, title, slug, description, coverUrl,
createdAt, author, totalViews, totalShares, totalComments, totalFavorites, tags`.

---

## Write-эндпоинты (требуют `Authorization: Bearer …`, роль `admin`/`organizer`)

Под них фронт сейчас имеет готовую форму (`PostCreateEditForm`,
`src/sections/blog/post-create-edit-form.tsx`) — нужно лишь включить реальный
сабмит вместо заглушки. Тело запроса = то, что собирает форма:

```jsonc
// POST /posts        (создание)
// PUT  /posts/{id}   (редактирование)
{
  "title": "string",
  "description": "string",
  "content": "string",            // HTML-строка из WYSIWYG-редактора; >= 100 символов
  "coverUrl": "string",           // уже загруженный URL (через /files/upload) или null
  "tags": ["string"],             // >= 2
  "metaTitle": "string",
  "metaDescription": "string",
  "metaKeywords": ["string"]      // >= 1
}
```

| Метод/путь | Ответ | Замечания |
|---|---|---|
| `POST /posts` | `{ "post": Post }` (201) | `slug` генерируй сам из title; верни созданный пост |
| `PUT /posts/{id}` | `{ "post": Post }` (200) | частичное/полное обновление |
| `DELETE /posts/{id}` | 204 | 404 если чужой/нет |

`publish` переключается тумблером в форме/тулбаре — приём значения
`"published"/"draft"` в `POST`/`PUT` (или отдельный `PATCH /posts/{id}/publish`
`{ "publish": "published" }` — на выбор; если сделаешь PATCH, скажи, подключу).

---

## Комментарии (опционально, если нужен реальный функционал комментариев)

На фронте есть `PostCommentForm` (пока без сабмита). Если делаем:

- `POST /posts/{id}/comments` `{ "message": "string" }` (auth) → `{ "comment": IPostComment }`
- ответы на комментарии — `POST /posts/{id}/comments/{commentId}/replies` `{ "message": "string" }`

Если комментарии пока не нужны — просто всегда отдавай `comments: []`, форму
оставлю задизейбленной.

---

## Контент = HTML (важно)

Поле `content` — это **готовый HTML**, который генерит rich-text редактор на
фронте (`Field.Editor`, TipTap-обёртка Minimal). На бэк улетает именно HTML
(теги `<p>`, `<h2>`, `<img>`, `<a>`, списки, форматирование), не Markdown.

- **Хранить как есть** (raw HTML), отдавать в `content` без изменений — фронт
  рендерит его компонентом `Markdown`/`dangerouslySetInnerHTML`.
- **Обязательна серверная санитизация при записи** (`POST`/`PUT`) — это
  пользовательский HTML, риск XSS. Прогоняй через белый список тегов/атрибутов
  (напр. `bleach`/`nh3`): разрешить форматирование, заголовки, списки, ссылки,
  изображения; вырезать `<script>`, инлайн-обработчики (`on*`), `javascript:`-URL.
- Картинки внутри контента, загруженные через `POST /files/upload`, будут
  ссылками вида `/api/files/{id}` — их в санитайзере не резать.

## Поведение/детали

- **Auth:** read — публично; write — Bearer + роль `admin`/`organizer` (как у
  остальных админ-операций). 401 без токена, 403 при нехватке прав.
- **Файлы обложки:** фронт грузит обложку через существующий `POST /files/upload`
  и кладёт в `coverUrl` готовый URL (`/api/files/{id}` уже работает в `<img>`).
- **Пагинация** для `GET /posts`: пока не требуется (фронт грузит весь список и
  фильтрует/сортирует на клиенте). Если постов станет много — согласуем
  `{items, total, page, per_page}`, как в Dogs.
- **Слаг-коллизии:** при дубле title добавляй суффикс (`-2`) — slug уникален.

## Что НЕ нужно

Не менять имена ключей-обёрток (`posts`/`post`/`latestPosts`/`results`) и поля
`Post` — иначе фронт придётся править. Всё остальное (внутреннее хранение,
индексы, генерация slug) — на усмотрение бэкенда.
