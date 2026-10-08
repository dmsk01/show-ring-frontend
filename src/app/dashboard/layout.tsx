import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

// Не индексировать: здесь нет публичного контента (план защиты 2026-10-05).
export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  if (CONFIG.auth.skip) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
