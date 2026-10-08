import type { Metadata } from 'next';

// ----------------------------------------------------------------------

// Страницы входа и регистрации не индексируются (план защиты 2026-10-05).
export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return children;
}
