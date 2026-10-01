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
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { getErrorMessage } from '../../utils';
import { redirectNewUser } from './phone-verified';
import { FormHead } from '../../components/form-head';
import { SignUpTerms } from '../../components/sign-up-terms';
import { useAuthContext, useAuthMethods } from '../../hooks';
import { PhoneOtpForm } from '../../components/phone-otp-form';
import { verifyPhoneCode, signInWithPassword } from '../../context/jwt';

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

// Бэкенд отдаёт машиночитаемые коды (detail) и rate-limit-строки — показывать
// их пользователю нельзя. Переводим в человекочитаемые сообщения; ключи
// сравниваем без учёта регистра, неизвестное падает в общий фолбэк.
const SIGN_IN_ERROR_KEYS: Record<string, string> = {
  invalid_credentials: 'auth:errors.invalidCredentials',
  user_blocked: 'auth:errors.userBlocked',
  login_method_disabled: 'auth:errors.methodDisabled',
  'too many requests': 'auth:errors.tooManyRequests',
  'rate limit subsystem unavailable': 'auth:errors.serviceUnavailable',
  'network error': 'auth:errors.network',
};

function resolveSignInError(error: unknown, t: TFunction<['auth']>): string {
  const raw = getErrorMessage(error).trim().toLowerCase();
  const key = SIGN_IN_ERROR_KEYS[raw];
  return t(key ?? 'auth:errors.generic');
}

// ----------------------------------------------------------------------

// Телефон — основной способ входа; почта — дополнительный, открывается
// ссылкой под формой или deep-link'ом ?method=email (так входит e2e-сетап).
type SignInMethod = 'phone' | 'email';

export function JwtSignInView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslate(['auth']);

  const { checkUserSession } = useAuthContext();
  const { canSignIn } = useAuthMethods();

  const emailEnabled = canSignIn('email_password');
  const [method, setMethod] = useState<SignInMethod>(
    searchParams.get('method') === 'email' ? 'email' : 'phone'
  );
  const activeMethod: SignInMethod = method === 'email' && emailEnabled ? 'email' : 'phone';

  const handlePhoneVerified = async ({ isNewUser }: { isNewUser: boolean }) => {
    if (isNewUser) {
      // Вход по неизвестному номеру создаёт аккаунт — ведём дозаполнить профиль
      // (там же — подсказка для тех, у кого уже был аккаунт по почте).
      redirectNewUser('sign-in', searchParams.get('returnTo'));
      return;
    }
    await checkUserSession?.();
    router.refresh();
  };

  const renderSwitch = () => {
    if (!emailEnabled) return null;
    const toEmail = activeMethod === 'phone';
    return (
      <Link
        component="button"
        type="button"
        variant="subtitle2"
        onClick={() => setMethod(toEmail ? 'email' : 'phone')}
        sx={{ mt: 3, alignSelf: 'center' }}
      >
        {toEmail ? t('auth:signIn.byEmail') : t('auth:signIn.byPhone')}
      </Link>
    );
  };

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

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {activeMethod === 'phone' ? (
          <PhoneOtpForm
            submitLabel={t('auth:signIn.submit')}
            verifyCode={verifyPhoneCode}
            onVerified={handlePhoneVerified}
            phoneFooter={
              <>
                {emailEnabled && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('auth:signIn.legacyHint')}
                  </Typography>
                )}
                <SignUpTerms variant="continue" sx={{ mt: 0 }} />
              </>
            }
          />
        ) : (
          <EmailSignInForm />
        )}

        {renderSwitch()}
      </Box>
    </>
  );
}

// ----------------------------------------------------------------------

function EmailSignInForm() {
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
      setErrorMessage(resolveSignInError(error, t));
    }
  });

  return (
    <>
      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
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
                      <Iconify
                        icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      />
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
            loadingIndicator={t('auth:signIn.submitting')}
          >
            {t('auth:signIn.submit')}
          </Button>
        </Box>
      </Form>
    </>
  );
}
