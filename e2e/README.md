# E2E (Playwright)

End-to-end тесты против **реального бэкенда Show Ring** (FastAPI :8000) и фронт
dev-сервера (:8082). Запуск:

```bash
npm run test:e2e        # dev-сервер (turbopack) — быстрый, для итераций
npm run test:e2e:ui     # интерактивный UI-режим
npm run test:e2e:prod   # ПРОД-сборка (next build + start) — детерминированно
```

`playwright.config.ts` сам поднимает фронт (`npm run dev`, :8082,
`reuseExistingServer`). Бэкенд-стек нужно поднять заранее.

**Dev vs prod.** В dev первый визит на тяжёлый роут (например
`/dashboard/shows/[id]/results`) запускает холодную turbopack-компиляцию (>60с) —
отсюда редкие first-attempt флаки (страхуются `retries:1`). Для детерминизма
(CI/проверка перед мержем) — `npm run test:e2e:prod`: `playwright.prod.config.ts`
наследует базовый конфиг и подменяет `webServer` на `next build && next start`
(всё скомпилировано заранее). Перед прод-прогоном убедитесь, что на :8082 нет
запущенного dev-сервера (иначе `reuseExistingServer` переиспользует его).

## Предпосылки (поднять ДО прогона)

1. **Бэкенд :8000** (docker-compose из репозитория бэка), `/health/` = 200.
2. **Сид-юзеры** (на бэке): `python -m scripts.seed_e2e_users --force` — создаёт
   `organizer/breeder/judge/buyer/operator/multi` на домене **`e2e.example`**
   (НЕ `.test` — его режет `EmailStr`→422), пароль `Password123!`. Плюс существующий
   `admin@admin.com` / `Password123!`.
3. **Рейт-лимит логина** на e2e-стеке бэка (см. ниже).

## ⚠️ AUTH_LOGIN_RATE_LIMIT на e2e-стеке

Бэкенд рейт-лимитит `/auth/login` (по умолчанию **5 / 60 c** на IP; бакет один на
весь стек — Playwright и API за nginx видятся как один IP, логины из global setup
складываются в одно ведро). Полный прогон делает ~7 логинов и упирается в `429`
(+ эскалация штрафа), что подвешивает setup.

**Для e2e/CI-окружения** (там же, где задаёте `SECRET_KEY`/`CORS_ALLOW_ORIGINS`
для стека под Playwright — `--env-file` / env CI-джобы):

```dotenv
# .env для e2e-стека (НЕ для прода)
AUTH_LOGIN_RATE_LIMIT=100
# AUTH_LOGIN_RATE_WINDOW_SECONDS не трогаем (дефолт 60)
```

`docker-compose.yml` бэка уже прокидывает `${AUTH_LOGIN_RATE_LIMIT:-5}` в сервис
`api` — больше ничего менять не надо. Проверка после `compose up`:

```bash
docker compose exec api printenv AUTH_LOGIN_RATE_LIMIT   # ожидаем 100
```

Почему 100, а не 7–8: запас под рост (больше сид-юзеров, ретраи логина,
параллельные шарды Playwright). 100 ≈ 14× текущей нагрузки и не требует пересмотра
на каждый новый сценарий; защита остаётся (бесконечный цикл логина в тесте всё ещё
упрётся в 429). Минимум впритык ~30–50, ниже 20 не опускаться.

**🚫 Только для e2e/CI.** В прод-`.env` этой переменной быть НЕ должно — там
работает дефолт `5/60`. `AUTH_LOGIN_RATE_LIMIT=100` в общем/прод `.env` тихо
ослабит защиту логина от credential stuffing.

> Локально повторные прогоны рейт-лимит почти не трогают: `roles.setup.ts`
> переиспользует свежий (≤25 мин) storageState вместо перелогина. Форсировать
> свежий логин: `E2E_FRESH_LOGIN=1`.

## Env-переменные

| Переменная | Дефолт | Назначение |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:8082` | фронт |
| `E2E_BACKEND_HEALTH` | `http://localhost:8000/health/` | health-гейт в setup |
| `E2E_FRESH_LOGIN` | — | `1` → форсить логин ролей (игнор reuse) |

## Состав

- `auth.setup.ts` — логин админа (UI) + пин локали; `roles.setup.ts` — сессии ролей
  (API-логин, reuse свежего storageState). Состояния → `e2e/.auth/*.json` (gitignore).
- Спеки: `shows`, `auth`, `show-entry`, `rbac`, `kennels`, `dogs`, `results`.
- `i18n.ts` — пин локали `i18next=ru` + `t(ns,key)` из словарей приложения
  (UI на RU по умолчанию, всё переведено через `t()` — ассертим строки из словарей).
- `users.ts` — сид-юзеры, домен-константа `e2e.example`, `apiLogin` (429-aware).

## Заметки

- Лайфсайкл статусов выставки: `in_progress` только через `registration_closed`
  (прямой переход из `registration_open` отклоняется).
- Роут `/dashboard/shows/[id]/results` тяжёлый: первая (холодная) turbopack-компиляция
  может занять >60 c — спек прогревает его в сиде; `retries: 1` страхует флапы.
