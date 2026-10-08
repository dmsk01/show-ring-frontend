import type { Metadata } from 'next';

import { AuthCenteredLayout } from 'src/layouts/auth-centered';

// ----------------------------------------------------------------------

// Не индексировать: здесь нет публичного контента (план защиты 2026-10-05).
export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <AuthCenteredLayout>{children}</AuthCenteredLayout>;
}
