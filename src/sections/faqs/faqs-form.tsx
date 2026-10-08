'use client';

import type { BoxProps } from '@mui/material/Box';

import { useTranslate } from 'src/locales';

import { SupportCta } from 'src/sections/contact/support-cta';

// ----------------------------------------------------------------------

// Форма-заглушка шаблона заменена путём в настоящую поддержку (как на
// странице «Контакты»).
export function FaqsForm(props: BoxProps) {
  const { t } = useTranslate('faqs');
  return <SupportCta title={t('form.title')} {...props} />;
}
