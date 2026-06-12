import type { BrowserContext } from '@playwright/test';

// ----------------------------------------------------------------------
// Локаль-привязка для e2e.
//
// UI полностью переведён через i18next (`t()`), а дефолтный язык приложения —
// RU (`src/locales/locales-config.ts` → fallbackLng='ru'). Чтобы тесты были
// детерминированы (а не зависели от Accept-Language браузера Playwright,
// который по умолчанию en-US), мы:
//   1) пиним язык кукой `i18next` (её читает сервер — см. src/locales/server.ts);
//   2) ассертим строки НЕ хардкодом, а из тех же словарей, что и приложение —
//      так правки переводов не ломают тесты «по тексту».
// ----------------------------------------------------------------------

import showRu from '../src/locales/langs/ru/show.json';
import dogRu from '../src/locales/langs/ru/dog.json';
import authRu from '../src/locales/langs/ru/auth.json';
import commonRu from '../src/locales/langs/ru/common.json';

export const E2E_LANG = 'ru';

const DICTS: Record<string, unknown> = {
  show: showRu,
  dog: dogRu,
  auth: authRu,
  common: commonRu,
};

/**
 * Мини-аналог i18next-`t`: `t('show', 'toast.created')` с интерполяцией
 * `{{var}}`. Кидает понятную ошибку, если ключ исчез/переименован — это ловит
 * рассинхрон тестов со словарём на этапе прогона, а не молчаливым «не нашёл».
 */
export function t(
  ns: string,
  key: string,
  vars?: Record<string, string | number>
): string {
  let node: unknown = DICTS[ns];
  if (node === undefined) throw new Error(`i18n namespace not found: ${ns}`);

  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      throw new Error(`i18n key not found: ${ns}:${key}`);
    }
  }

  if (typeof node !== 'string') throw new Error(`i18n key is not a string: ${ns}:${key}`);

  return vars
    ? node.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
        vars[name] !== undefined ? String(vars[name]) : `{{${name}}}`
      )
    : node;
}

/** Пиним язык приложения кукой `i18next` для данного origin. */
export async function pinLocale(context: BrowserContext, baseUrl: string): Promise<void> {
  await context.addCookies([{ name: 'i18next', value: E2E_LANG, url: baseUrl }]);
}
