'use client';

import { useState, useEffect, useCallback } from 'react';

import Link from '@mui/material/Link';
import Slide from '@mui/material/Slide';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VALUE,
  COOKIE_CONSENT_MAX_AGE,
} from './config';

// ----------------------------------------------------------------------

export type CookieConsentProps = {
  /** Server-detected consent flag — prevents the banner from flashing on first paint. */
  consented?: boolean;
};

export function CookieConsent({ consented }: CookieConsentProps) {
  const { t } = useTranslate('cookies');

  const [open, setOpen] = useState(!consented);

  // Re-check on the client too: covers static export (no server signal) and
  // keeps a single source of truth (document.cookie).
  useEffect(() => {
    const accepted = document.cookie
      .split('; ')
      .some((row) => row === `${COOKIE_CONSENT_KEY}=${COOKIE_CONSENT_VALUE}`);

    if (accepted) {
      setOpen(false);
    }
  }, []);

  const handleAccept = useCallback(() => {
    document.cookie = `${COOKIE_CONSENT_KEY}=${COOKIE_CONSENT_VALUE}; max-age=${COOKIE_CONSENT_MAX_AGE}; path=/; SameSite=Lax`;
    setOpen(false);
  }, []);

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        role="region"
        aria-label={t('message')}
        sx={(theme) => ({
          left: 16,
          right: 16,
          bottom: 16,
          zIndex: theme.zIndex.snackbar,
          position: 'fixed',
          mx: 'auto',
          p: 2.5,
          maxWidth: 720,
          borderRadius: 2,
        })}
      >
        <Stack
          spacing={2}
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ alignItems: { sm: 'center' } }}
        >
          <Typography variant="body2" sx={{ flexGrow: 1, color: 'text.secondary' }}>
            {t('message')}{' '}
            {/* Статический HTML в public/ — обычный <a>, не клиентский роутинг Next. */}
            <Link href={paths.legal.privacy} target="_blank" rel="noopener" color="primary">
              {t('privacyLink')}
            </Link>
            .
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={handleAccept}
            sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}
          >
            {t('accept')}
          </Button>
        </Stack>
      </Paper>
    </Slide>
  );
}
