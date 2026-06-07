'use client';

import type { IconButtonProps } from '@mui/material/IconButton';

import Skeleton from '@mui/material/Skeleton';

import { usePermissions } from 'src/hooks/use-permissions';

import { useTranslate } from 'src/locales';

import { useAuthContext } from 'src/auth/hooks';

import { SignInButton } from './sign-in-button';
import { AccountDrawer } from './account-drawer';
import { getAccountNavData } from '../nav-config-account';

// ----------------------------------------------------------------------

/**
 * Хедер-переключатель: пока грузится сессия — скелетон (без скачка layout);
 * залогинен — AccountDrawer (аватар + ЛК); иначе — кнопка входа.
 */
export function AccountControl({ sx, ...other }: IconButtonProps) {
  const { authenticated, loading } = useAuthContext();
  const { can } = usePermissions();
  const { t } = useTranslate('account');

  if (loading) {
    return <Skeleton variant="circular" width={40} height={40} />;
  }

  if (!authenticated) {
    return <SignInButton />;
  }

  return <AccountDrawer data={getAccountNavData(t, can)} sx={sx} {...other} />;
}
