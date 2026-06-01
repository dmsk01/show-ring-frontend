'use client';

import { BackToTopButton } from 'src/components/animate/back-to-top-button';
import { ScrollProgress, useScrollProgress } from 'src/components/animate/scroll-progress';

import { LandingSeo } from '../landing-seo';
import { LandingNews } from '../landing-news';
import { LandingHero } from '../landing-hero';
import { LandingFAQs } from '../landing-faqs';
import { LandingStats } from '../landing-stats';
import { LandingRoadmap } from '../landing-roadmap';
import { LandingProvider } from '../landing-lang-context';
import { LandingAdvantages } from '../landing-advantages';

// ----------------------------------------------------------------------

export function LandingView() {
  const pageProgress = useScrollProgress();

  return (
    <LandingProvider>
      <ScrollProgress
        variant="linear"
        progress={pageProgress.scrollYProgress}
        sx={[(theme) => ({ position: 'fixed', zIndex: theme.zIndex.appBar + 1 })]}
      />

      <BackToTopButton />

      <LandingHero />
      <LandingAdvantages />
      <LandingStats />
      <LandingRoadmap />
      <LandingFAQs />
      <LandingNews />
      <LandingSeo />
    </LandingProvider>
  );
}
