import type { Metadata } from 'next';

import { LandingView } from 'src/sections/landing/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Show Ring — выставки собак и кошек онлайн',
  description:
    'Show Ring — платформа для участия в выставках собак и кошек по правилам РКФ и FCI: регистрация на выставку, профиль питомника, учёт родословных и титулов, заявки и результаты в одном месте.',
};

export default function Page() {
  return <LandingView />;
}
