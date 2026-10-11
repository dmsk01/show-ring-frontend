'use client';

import { mutate } from 'swr';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { isNotFoundError } from 'src/utils/api-error';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

type Props = {
  error: unknown;
  /** Текст «не найдено» из словаря раздела. */
  notFoundText: string;
  /** Ключ SWR для повтора загрузки. */
  swrKey: string;
};

/**
 * Пустое состояние детальной страницы: «не найдено» — только на 404; сбой
 * сервера или сети — «ошибка загрузки» с повтором (ревью 2026-10-09, FE-16).
 * Раньше на 500 и без сети показывалось «не найдено».
 */
export function DetailLoadError({ error, notFoundText, swrKey }: Props) {
  const { t } = useTranslate('common');
  const notFound = !error || isNotFoundError(error);

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
      <Typography>{notFound ? notFoundText : t('state.error')}</Typography>
      {!notFound && (
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => mutate(swrKey)}>
          {t('actions.retry')}
        </Button>
      )}
    </Container>
  );
}
