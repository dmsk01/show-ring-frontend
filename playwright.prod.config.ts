import { defineConfig } from '@playwright/test';

import base from './playwright.config';

// ----------------------------------------------------------------------
// E2E против ПРОД-СБОРКИ (`next build` + `next start`) вместо turbopack-dev.
// Зачем: в dev первый визит на тяжёлый роут (например /dashboard/shows/[id]/
// results) запускает холодную компиляцию (>60с) → редкие first-attempt флаки.
// В прод-сборке всё скомпилировано заранее → детерминированно.
//
// Запуск: `npm run test:e2e:prod`. webServer делает build, затем start на :8082;
// сборка может занять минуты — отсюда большой timeout. Всё остальное (projects,
// setup, retries, use) наследуется из базового конфига.
// ----------------------------------------------------------------------

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8082';

export default defineConfig({
  ...base,
  webServer: {
    command: 'npm run build && npm run start',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 600_000,
  },
});
