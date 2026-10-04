'use client';

import Link from '@mui/material/Link';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';

import { useAuthContext } from '../../hooks';
import { redirectNewUser } from './phone-verified';
import { verifyPhoneCode } from '../../context/jwt';
import { FormHead } from '../../components/form-head';
import { SignUpTerms } from '../../components/sign-up-terms';
import { PhoneOtpForm } from '../../components/phone-otp-form';

// ----------------------------------------------------------------------

// Регистрация — только по своему телефону: аккаунт создаётся, когда человек
// подтвердил номер кодом из SMS. Вход по почте подключается позже в профиле
// (Безопасность → Вход по почте). Бэкенд /auth/register по email закрыт.
export function JwtSignUpView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslate(['auth']);

  const { checkUserSession } = useAuthContext();

  const handleVerified = async ({ isNewUser }: { isNewUser: boolean }) => {
    if (isNewUser) {
      redirectNewUser('sign-up', searchParams.get('returnTo'));
      return;
    }
    // Номер уже зарегистрирован — это обычный вход в существующий аккаунт.
    await checkUserSession?.();
    router.refresh();
  };

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

      <PhoneOtpForm
        submitLabel={t('auth:signUp.submit')}
        verifyCode={verifyPhoneCode}
        requireConsent
        onVerified={handleVerified}
        phoneFooter={<SignUpTerms sx={{ mt: 0 }} />}
      />
    </>
  );
}
