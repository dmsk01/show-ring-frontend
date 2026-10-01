'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { useAuthContext, useAuthMethods } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const SECURITY_PATH = `${paths.dashboard.profile}/security`;

/**
 * Телефон — основной способ входа, и каждый аккаунт должен его иметь. Аккаунты,
 * созданные по email до перехода на телефон, мягко просим привязать номер:
 * баннер в шапке дашборда, без блокировки работы.
 */
export function PhoneRequiredBanner() {
  const { t } = useTranslate(['profile']);
  const pathname = usePathname();

  const { user, authenticated } = useAuthContext();
  const { phone_required } = useAuthMethods();

  if (!authenticated || !phone_required || user?.is_phone_verified) return null;
  // На странице привязки баннер дублирует карточку «Номер телефона».
  if (pathname.startsWith(SECURITY_PATH)) return null;

  return (
    <Alert
      severity="warning"
      sx={{ borderRadius: 0 }}
      action={
        <Button component={RouterLink} href={SECURITY_PATH} color="inherit" size="small">
          {t('profile:banner.phoneRequiredAction')}
        </Button>
      }
    >
      {t('profile:banner.phoneRequired')}
    </Alert>
  );
}
