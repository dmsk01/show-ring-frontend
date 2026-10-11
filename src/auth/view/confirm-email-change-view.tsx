'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { confirmEmailChange } from 'src/actions/account';
import { SentIcon, EmailInboxIcon } from 'src/assets/icons';
import { accountErrorKey } from 'src/actions/account-errors';

import { useAuthContext } from '../hooks';
import { FormHead } from '../components/form-head';
import { resetRevokedSession } from '../context/jwt/action';
import { FormReturnLink } from '../components/form-return-link';

// ----------------------------------------------------------------------

export function ConfirmEmailChangeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { checkUserSession } = useAuthContext();
  const { t } = useTranslate('account');

  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onConfirm = async () => {
    if (!token) {
      setErrorMessage('account:errors.invalidOrExpiredToken');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await confirmEmailChange(token);
      // Бэкенд отозвал все refresh-токены — сносим локальную сессию и
      // синхронизируем React-контекст (детали — в resetRevokedSession).
      await resetRevokedSession(checkUserSession);
      setSuccess(true);
    } catch (error) {
      console.error(error);
      setErrorMessage(accountErrorKey(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <FormHead
          icon={<SentIcon />}
          title={t('confirmEmail.doneTitle')}
          description={t('confirmEmail.doneDescription')}
        />

        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={() => router.push(paths.auth.jwt.signIn)}
        >
          {t('confirmEmail.signIn')}
        </Button>
      </>
    );
  }

  return (
    <>
      <FormHead
        icon={<EmailInboxIcon />}
        title={t('confirmEmail.title')}
        description={t('confirmEmail.description')}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t(errorMessage)}
        </Alert>
      )}

      <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
        <Button
          fullWidth
          size="large"
          variant="contained"
          loading={isSubmitting}
          disabled={!token}
          onClick={onConfirm}
        >
          {t('confirmEmail.submit')}
        </Button>
      </Box>

      <FormReturnLink href={paths.auth.jwt.signIn} label={t('confirmEmail.backToSignIn')} />
    </>
  );
}
