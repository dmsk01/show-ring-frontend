# Дизайн: упрочнение загрузки файлов (размер/тип/квоты)

Дата: 2026-06-15
Статус: согласование

## Проблема

Бэкенд ужесточил `POST /files/upload`: новые коды **429** (суточный лимит
загрузок), **413** (квота объёма аккаунта), **503** (backpressure хранилища),
плюс прежние **415** (тип) и **413** (размер > 10 МБ). Фронт сейчас:

- `uploadFile` (`src/actions/file.ts`) шлёт файл как есть — без клиентского
  лимита размера/типа. Большие фото зря бьют по бэку.
- Ошибки приходят через глобальный axios-интерсептор, который **схлопывает
  любой ответ в `new Error(detail)`** (`src/lib/axios.ts:123-125`) — статус,
  заголовки и структурное тело (`reset_at`, `retry_after_seconds`, `tier`,
  `max_storage_bytes`…) теряются. Пользователь видит сырой машинный код.

Цель: не грузить бэк лишними байтами и показывать человеку понятное сообщение.

Вне области (отдельные под-проекты, НЕ здесь): админ-UI квот
(`/admin/upload-quotas`), тоггл feature-flags (`PUT /feature-flags/{name}`).
Соцсети (#2) и поиск в списках (#3) уже реализованы — не трогаем.

## Политика (согласовано)

- **Зеркало бэка (жёсткий отказ):** размер > **10 МБ** или тип не из
  разрешённых → отклоняем на клиенте, не отправляя запрос. Разрешённые:
  изображения **jpeg, png, webp, gif**; документы **pdf**
  (`max_upload_size_bytes = 10 МБ`, магические байты бэка).
- **Фото автоматически ужимаем** в браузере до цели **~2 МБ**: даунскейл
  длинной стороны до **≤ 2048px**, переэнкод в **webp** (качество от 0.82
  вниз шагами до ~0.5, пока не ≤ 2 МБ). Если не удалось дотянуть до 2 МБ, но файл
  ≤ 10 МБ — грузим как есть (не блокируем).
- **GIF не сжимаем** (canvas убил бы анимацию) — только гейт 10 МБ/типа.
- **pdf** не сжимаем — только гейт 10 МБ/типа.

## Архитектура

### 1. Сохранить структурную ошибку (общая правка интерсептора)

`src/lib/axios.ts`: в обработчике ошибок, не меняя `message`, навесить на
отклоняемый `Error` ссылку на исходный ответ:

```ts
const err = new Error(typeof message === 'string' ? message : 'Request failed');
(err as AxiosLikeError).status = status;
(err as AxiosLikeError).response = error?.response; // data + headers
return Promise.reject(err);
```

Изменение аддитивное: существующие читатели `error.message` не затронуты;
новые читатели получают `error.status` / `error.response.data` /
`error.response.headers`. Тип `AxiosLikeError` объявляем рядом.

### 2. Компрессор и валидатор (новый модуль)

`src/utils/upload-image.ts` — браузерный, без новых зависимостей:

- Константы: `MAX_UPLOAD_BYTES = 10*1024*1024`, `TARGET_IMAGE_BYTES = 2*1024*1024`,
  `MAX_IMAGE_EDGE = 2048`, `ALLOWED_IMAGE_TYPES` (jpeg/png/webp/gif),
  `ALLOWED_DOC_TYPES` (pdf).
- `getUploadRejection(file): 'unsupported_type' | 'file_too_large' | null` —
  чистая функция (тип + размер). Юнит-тестируема.
- `compressImageFile(file): Promise<File>` — через `createImageBitmap(file, {
  imageOrientation: 'from-image' })` (EXIF-поворот) → `<canvas>` ресайз →
  `canvas.toBlob('image/webp', q)` с понижением q до цели. Не-сжимаемые
  (gif/pdf/не-изображения) возвращаются как есть. Браузер-онли; вызывается
  только из client-компонентов.

### 3. Парсер ошибок загрузки

`src/actions/file.ts` (или рядом `file-errors.ts`):

- Тип `UploadErrorCode = 'rate_limited' | 'storage_full' | 'unsupported_type'
  | 'file_too_large' | 'storage_busy' | 'generic'`.
- `class UploadError extends Error { code; retryAfterSeconds?; resetAt? }`.
- `parseUploadError(error): UploadError` — по `error.status` + телу:
  - 429 → `rate_limited` (+ `resetAt` из `data.reset_at`,
    `retryAfterSeconds` из `data.retry_after_seconds`/заголовка `Retry-After`).
  - 413 → `storage_full` (тело `max_storage_bytes`/`used_bytes`) ИЛИ
    `file_too_large` для пер-файлового размера — различаем по наличию
    `max_storage_bytes` в теле.
  - 415 → `unsupported_type`.
  - 503 → `storage_busy`.
  - иначе → `generic`. Чистая функция, юнит-тестируема.

### 4. `uploadFile` — гейт, сжатие, ретрай

```
uploadFile(file):
  rejection = getUploadRejection(file)
  if rejection: throw new UploadError(rejection)
  payload = isCompressibleImage(file) ? await compressImageFile(file) : file
  for attempt in 0..MAX_503_RETRIES:        // MAX = 2
    try: return await axios.post(upload, formData(payload))
    catch e:
      ue = parseUploadError(e)
      if ue.code === 'storage_busy' && attempt < MAX:
        await sleep(retryAfter(e) ?? 5s); continue
      throw ue
```

### 5. Локализованные сообщения

`uploadErrorMessage(error, t): string` — маппинг `UploadErrorCode` → строка:

- `rate_limited` → «Дневной лимит загрузок исчерпан. Попробуйте после
  {time}» (где `{time}` = `fDateTime(resetAt)`; если нет — «позже»).
- `storage_full` → «Закончилось место. Удалите старые файлы и повторите.»
- `file_too_large` → «Файл больше 10 МБ.»
- `unsupported_type` → «Недопустимый формат. Разрешены JPEG, PNG, WebP, GIF.»
- `storage_busy` → «Хранилище перегружено, попробуйте ещё раз.»
- `generic` → общий текст.

Ключи i18n — в namespace `common` под `upload.*` (RU+EN), т.к. загрузка
кросс-доменная.

### 6. Точки вызова (обновить обработку ошибок)

Заменить generic-тосты на `uploadErrorMessage(err, t)`:

- `src/components/file-upload/file-avatar-uploader.tsx` (сейчас хардкод
  англ. 'Upload failed' / 'Image uploaded!').
- `src/sections/classified/classified-images-upload.tsx` (показывать причину
  первого rejected из `allSettled`, а не только общий «частично не удалось»).
- `src/sections/dog/dog-create-edit-form.tsx` (`Promise.all` загрузок).

Логика самого сжатия/гейта централизована в `uploadFile`, поэтому формы
правятся минимально — только сообщения.

## Тестирование (vitest, чистая логика)

- `getUploadRejection`: > 10 МБ → `file_too_large`; не-разрешённый тип →
  `unsupported_type`; валидный → `null`.
- `parseUploadError`: 429 c `reset_at`/`Retry-After`; 413 c `max_storage_bytes`
  → `storage_full`; 413 без него → `file_too_large`; 415 → `unsupported_type`;
  503 → `storage_busy`; прочее → `generic`.
- `uploadErrorMessage`: каждый код даёт непустую строку; `rate_limited`
  включает время из `resetAt`.

Сжатие на canvas (`compressImageFile`) юнит-тестами не покрываем — jsdom не
даёт canvas/`createImageBitmap`; держим функцию изолированной. Проверяется
ручным прогоном.

## Краевые случаи

- **SSR:** `uploadFile`/компрессор зовутся только из `'use client'`
  компонентов (dropzone). Браузерные API безопасны.
- **Сжатие не помогло** (фото уже оптимально, но > 2 МБ и ≤ 10 МБ): грузим
  как есть — не блокируем пользователя.
- **GIF/PDF:** проходят без сжатия; гейт 10 МБ/типа работает.
- **503 после ретраев:** показываем `storage_busy` (без бесконечного цикла —
  максимум 2 повтора).
- **Прозрачность PNG:** webp сохраняет альфу — артефактов нет.

## Проверки

- `npx tsc --noEmit` → 0; `npm run lint` → 0; `npm test` → зелёно (новые
  юниты на `getUploadRejection`/`parseUploadError`/`uploadErrorMessage`).
- Ручная: загрузка фото 6 МБ → уходит ~1–1.5 МБ webp, успех; pdf 12 МБ →
  отказ «больше 10 МБ» без запроса; (если воспроизводимо) 429/503 — корректные
  сообщения/ретрай.
