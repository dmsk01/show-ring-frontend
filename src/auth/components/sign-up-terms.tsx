import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

type SignUpTermsProps = BoxProps & {
  // 'continue' — для экрана входа по телефону: вход по неизвестному номеру
  // создаёт аккаунт, поэтому согласие нужно и там («Продолжая, я принимаю…»).
  variant?: 'signUp' | 'continue';
};

export function SignUpTerms({ sx, variant = 'signUp', ...other }: SignUpTermsProps) {
  const { t } = useTranslate('auth');

  // Новая вкладка — чтобы не терять заполненную форму входа/регистрации.
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
      {t(variant === 'continue' ? 'terms.continuePrefix' : 'terms.prefix')}
      <Link href={paths.legal.terms} {...linkProps}>
        {t('terms.terms')}
      </Link>
      {t('terms.mid')}
      <Link href={paths.legal.privacy} {...linkProps}>
        {t('terms.privacy')}
      </Link>
      {t('terms.suffix')}
    </Box>
  );
}

// ----------------------------------------------------------------------

/**
 * Подпись к отдельному чекбоксу согласия на обработку ПДн. Согласие — не
 * часть фразы о принятии Соглашения (ч. 1 ст. 9 152-ФЗ в ред. 156-ФЗ).
 */
export function PersonalDataConsentLabel() {
  const { t } = useTranslate('auth');

  return (
    <Box component="span" sx={{ typography: 'body2', color: 'text.secondary' }}>
      {t('consent.prefix')}
      <Link
        href={paths.legal.consent}
        target="_blank"
        rel="noopener"
        underline="always"
        color="text.primary"
        onClick={(event) => event.stopPropagation()}
      >
        {t('consent.link')}
      </Link>
    </Box>
  );
}
