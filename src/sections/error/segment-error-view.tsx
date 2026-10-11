'use client';

import { useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

type Props = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Экран необработанной ошибки рендера сегмента (app/error.tsx,
 * app/dashboard/error.tsx). Без него пользователь видел стандартную
 * англоязычную заглушку Next без навигации (ревью 2026-10-09, FE-26).
 */
export function SegmentErrorView({ error, retry }: Props) {
  const { t } = useTranslate('common');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container sx={{ py: 10 }}>
      <EmptyContent
        filled
        title={t('state.error')}
        action={
          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => retry()}>
              {t('actions.retry')}
            </Button>
            <Button component={RouterLink} href="/" variant="outlined" color="inherit">
              {t('actions.back')}
            </Button>
          </Stack>
        }
        sx={{ py: 10 }}
      />
    </Container>
  );
}
