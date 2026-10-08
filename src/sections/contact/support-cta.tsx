'use client';

import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { LEGAL_OPERATOR } from 'src/sections/legal/operator';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------
// «Написать нам» вместо формы-заглушки шаблона (план защиты 2026-10-05,
// этап 4). Обращения идут в существующую поддержку (/dashboard/support):
// там история переписки, лимиты (5 обращений в час) и не нужна отдельная
// анонимная ручка, которая собирала бы имя и email незнакомцев (отдельное
// согласие на обработку ПДн) и стала бы целью для спам-ботов.

type Props = BoxProps & { title: string };

export function SupportCta({ title, sx, ...other }: Props) {
  const { t } = useTranslate('contact');
  const { authenticated } = useAuthContext();

  const newTicket = paths.dashboard.support.new;
  const signInThenTicket = `${paths.auth.jwt.signIn}?${new URLSearchParams({ returnTo: newTicket })}`;
  const email = LEGAL_OPERATOR.supportEmail;

  return (
    <Box sx={sx} {...other}>
      <Typography variant="h3">{title}</Typography>
      <Typography sx={{ mt: 2, mb: 4, color: 'text.secondary' }}>
        {authenticated ? t('cta.textAuthenticated') : t('cta.textGuest')}
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' } }}
      >
        <Button
          component={RouterLink}
          href={authenticated ? newTicket : signInThenTicket}
          size="large"
          variant="contained"
          startIcon={<Iconify icon="solar:chat-round-dots-bold" />}
        >
          {authenticated ? t('cta.newTicket') : t('cta.signInToWrite')}
        </Button>

        {email && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('cta.orEmail')}{' '}
            <Link href={`mailto:${email}`} underline="always">
              {email}
            </Link>
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
