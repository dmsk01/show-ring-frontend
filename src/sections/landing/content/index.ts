import { en } from './en';
import { ru } from './ru';

// ----------------------------------------------------------------------

export type CardText = { title: string; text: string };
export type StepItem = { title: string; text: string };
export type StatText = { label: string };
export type FaqItem = { q: string; a: string };
export type NewsItem = { title: string; date: string; excerpt: string };

export type LandingContent = {
  nav: { signIn: string };
  hero: { badge: string; title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string };
  advantages: { caption: string; title: string; items: CardText[] };
  stats: { caption: string; title: string; items: StatText[] };
  roadmap: { caption: string; title: string; steps: StepItem[] };
  faqs: {
    caption: string;
    title: string;
    items: FaqItem[];
    contactTitle: string;
    contactText: string;
    contactCta: string;
  };
  news: { caption: string; title: string; items: NewsItem[] };
  seo: { title: string; paragraphs: string[] };
};

export type LandingLang = 'ru' | 'en';

export const landingContent: Record<LandingLang, LandingContent> = { ru, en };
