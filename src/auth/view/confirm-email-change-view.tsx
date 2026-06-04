'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { confirmEmailChange } from 'src/actions/account';
import { SentIcon, EmailInboxIcon } from 'src/assets/icons';
import { accountErrorMessage } from 'src/actions/account-errors';

import { signOut } from '../context/jwt/action';
import { FormHead } from '../components/form-head';
import { FormReturnLink } from '../components/form-return-link';

// ----------------------------------------------------------------------

export function ConfirmEmailChangeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onConfirm = async () => {
    if (!token) {
      setErrorMessage('Ссылка недействительна или устарела');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await confirmEmailChange(token);
      // Бэкенд отозвал все refresh-токены — чистим локальную сессию.
      await signOut();
      setSuccess(true);
    } catch (error) {
      console.error(error);
      setErrorMessage(accountErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <FormHead
          icon={<SentIcon />}
          title="Email изменён"
          description="Войдите заново, используя новый адрес."
        />

        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={() => router.push(paths.auth.jwt.signIn)}
        >
          Войти
        </Button>
      </>
    );
  }

  return (
    <>
      <FormHead
        icon={<EmailInboxIcon />}
        title="Подтверждение смены email"
        description={`Нажмите кнопку, чтобы завершить смену адреса.\nПосле подтверждения вы выйдете из аккаунта на всех устройствах.`}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
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
          Подтвердить смену email
        </Button>
      </Box>

      <FormReturnLink href={paths.auth.jwt.signIn} label="Вернуться ко входу" />
    </>
  );
}
