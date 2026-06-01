'use client';

import type { LandingLang, LandingContent } from './content';

import { useTranslate } from 'src/locales';

import { landingContent } from './content';

// ----------------------------------------------------------------------

/**
 * Landing language is derived from the app-wide i18n language (switched via the
 * shared LanguagePopover). The landing only ships RU and EN copy, so any other
 * app language falls back to English.
 */
export function useLanding(): { lang: LandingLang; t: LandingContent } {
  const { currentLang } = useTranslate();
  const lang: LandingLang = currentLang.value === 'ru' ? 'ru' : 'en';

  return { lang, t: landingContent[lang] };
}
