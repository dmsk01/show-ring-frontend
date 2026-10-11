'use client';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslate('blog');

  return (
    <Container sx={{ mt: 5, mb: 10 }}>
      <EmptyContent
        filled
        title={t('detail.notFound')}
        action={
          <Button
            component={RouterLink}
            href={paths.post.root}
            startIcon={<Iconify width={16} icon="eva:arrow-ios-back-fill" />}
            sx={{ mt: 3 }}
          >
            {t('detail.backToList')}
          </Button>
        }
        sx={{ py: 10 }}
      />
    </Container>
  );
}
