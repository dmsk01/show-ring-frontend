'use client';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

/**
 * Согласие на распространение контактов (ст. 10.1 152-ФЗ) у конкретной
 * публикации — питомника или объявления. Выключено по умолчанию: молчание
 * не считается согласием (ч. 8 ст. 10.1). Бэкенд пишет включение/выключение
 * в журнал согласий и скрывает контакты от посторонних, пока флаг выключен.
 */
export function PublicContactsSwitch({ name = 'contacts_public' }: { name?: string }) {
  const { t } = useTranslate('legal');

  return (
    <Field.Switch
      name={name}
      label={t('contacts.label')}
      helperText={
        <Box component="span">
          {t('contacts.helper')}{' '}
          <Link href={paths.legal.publicConsent} target="_blank" rel="noopener" underline="always">
            {t('contacts.link')}
          </Link>
        </Box>
      }
      sx={{ alignItems: 'flex-start' }}
    />
  );
}
