import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export function SignUpTerms({ sx, ...other }: BoxProps) {
  const { t } = useTranslate('auth');

  // Статические HTML в public/ — открываем в новой вкладке обычной ссылкой,
  // чтобы не терять заполненную форму регистрации.
  const linkProps = {
    target: '_blank',
    rel: 'noopener',
    underline: 'always',
    color: 'text.primary',
  } as const;

  return (
    <Box
      component="span"
      sx={[
        () => ({
          mt: 3,
          display: 'block',
          textAlign: 'center',
          typography: 'caption',
          color: 'text.secondary',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {t('terms.prefix')}
      <Link href={paths.legal.terms} {...linkProps}>
        {t('terms.terms')}
      </Link>
      {t('terms.mid')}
      <Link href={paths.legal.privacy} {...linkProps}>
        {t('terms.privacy')}
      </Link>
      {t('terms.consentMid')}
      <Link href={paths.legal.consent} {...linkProps}>
        {t('terms.consent')}
      </Link>
      {t('terms.suffix')}
    </Box>
  );
}
