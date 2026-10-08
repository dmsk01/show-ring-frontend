'use client';

import type { BoxProps } from '@mui/material/Box';

import { useTranslate } from 'src/locales';

import { SupportCta } from './support-cta';

// ----------------------------------------------------------------------

// Раньше здесь была форма-заглушка шаблона: кнопка «Отправить» ничего не
// отправляла, сообщение пропадало. Теперь — путь в настоящую поддержку.
export function ContactForm(props: BoxProps) {
  const { t } = useTranslate('contact');
  return <SupportCta title={t('form.title')} {...props} />;
}
