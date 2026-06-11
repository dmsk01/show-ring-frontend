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

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { signInWithPassword } from '../../context/jwt';

// ----------------------------------------------------------------------

// Вход — пароль лишь обязателен (аутентификация существующих учёток, а не
// создание): не навязываем 8–128, чтобы не блокировать легаси-пароли. Полную
// политику применяем на регистрации/смене пароля (src/auth/password-policy.ts).
function getSignInSchema(t: TFunction<['auth']>) {
  return z.object({
    email: schemaUtils.email({
      error: {
        required: t('auth:validation.emailRequired'),
        invalid: t('auth:validation.emailInvalid'),
      },
    }),
    password: z.string().min(1, { error: t('auth:validation.passwordRequired') }),
  });
}

export type SignInSchemaType = z.infer<ReturnType<typeof getSignInSchema>>;

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();
  const { t } = useTranslate(['auth']);

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const SignInSchema = useMemo(() => getSignInSchema(t), [t]);

  const methods = useForm<SignInSchemaType>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signInWithPassword({ email: data.email, password: data.password });
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

      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Link
          component={RouterLink}
          href="#"
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          {t('auth:signIn.forgotPassword')}
        </Link>

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
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('auth:signIn.submitting')}
      >
        {t('auth:signIn.submit')}
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title={t('auth:signIn.title')}
        description={
          <>
            {`${t('auth:signIn.noAccount')} `}
            <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2">
              {t('auth:signIn.getStarted')}
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
    </>
  );
}
