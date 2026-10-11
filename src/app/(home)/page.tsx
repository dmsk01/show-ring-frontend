import type { Metadata } from 'next';

import { LandingView } from 'src/sections/landing/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Show Ring — выставки собак онлайн',
  description:
    'Show Ring — платформа для участия в выставках собак по правилам РКФ и FCI: регистрация на выставку, профиль питомника, учёт родословных и титулов, заявки и результаты в одном месте.',
};

export default function Page() {
  return <LandingView />;
}
