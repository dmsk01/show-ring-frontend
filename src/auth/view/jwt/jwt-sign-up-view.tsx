'use client';

import type { TFunction } from 'i18next';

import * as z from 'zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { signUp } from '../../context/jwt';
import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { passwordPolicy } from '../../password-policy';
import { SignUpTerms } from '../../components/sign-up-terms';

// ----------------------------------------------------------------------

// Бэкенд /auth/register (UserCreate) принимает только { email, password } —
// имя/фамилию НЕ собираем, иначе введённые значения молча выбрасывались бы.
// Пароль — единая политика с бэкендом (8–128 символов, ≤72 байт UTF-8).
function getSignUpSchema(t: TFunction<['auth']>) {
  return z.object({
    email: schemaUtils.email({
      error: {
        required: t('auth:validation.emailRequired'),
        invalid: t('auth:validation.emailInvalid'),
      },
    }),
    password: passwordPolicy({
      min: t('auth:validation.passwordMin'),
      max: t('auth:validation.passwordMax'),
      bytes: t('auth:validation.passwordBytes'),
    }),
  });
}

export type SignUpSchemaType = z.infer<ReturnType<typeof getSignUpSchema>>;

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const router = useRouter();
  const { t } = useTranslate(['auth']);

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const SignUpSchema = useMemo(() => getSignUpSchema(t), [t]);

  const methods = useForm<SignUpSchemaType>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signUp({ email: data.email, password: data.password });
      await checkUserSession?.();

      router.refresh();
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="email"
        label={t('auth:fields.email')}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Field.Text
        name="password"
        label={t('auth:fields.password')}
        placeholder={t('auth:fields.passwordPlaceholder')}
        type={showPassword.value ? 'text' : 'password'}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={showPassword.onToggle} edge="end">
                  <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('auth:signUp.submitting')}
      >
        {t('auth:signUp.submit')}
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title={t('auth:signUp.title')}
        description={
          <>
            {`${t('auth:signUp.haveAccount')} `}
            <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="subtitle2">
              {t('auth:signUp.signInLink')}
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <SignUpTerms />
    </>
  );
}
