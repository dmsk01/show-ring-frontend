import type { LandingContent } from './index';

// ----------------------------------------------------------------------

export const en: LandingContent = {
  nav: { signIn: 'Sign in' },
  hero: {
    badge: 'Dog show platform',
    title: 'Step into the ring — without the paperwork',
    subtitle:
      'Show Ring brings breeders, handlers and organizers together: show registration, dog records, entries and results — all in one place.',
    ctaPrimary: 'Enter the ring',
    ctaSecondary: 'Sign in',
  },
  advantages: {
    caption: 'Why Show Ring',
    title: 'Everything you need to compete',
    items: [
      {
        title: 'Save time',
        text: 'Submit show entries in minutes instead of queues and paperwork.',
      },
      {
        title: 'Easy records',
        text: 'All your animals, pedigrees and titles in a single profile.',
      },
      {
        title: 'Fast entries',
        text: 'Apply to events in one click and track their status in real time.',
      },
      {
        title: 'Clear results',
        text: 'Grades, rings and show outcomes — online and without delays.',
      },
    ],
  },
  stats: {
    caption: 'Show Ring in numbers',
    title: 'A community that keeps growing',
    items: [
      { label: 'active users' },
      { label: 'breeders & kennels' },
      { label: 'platform visits' },
      { label: 'entries submitted' },
    ],
  },
  roadmap: {
    caption: 'How it works',
    title: 'Three steps to the ring',
    steps: [
      {
        title: 'Sign up',
        text: 'Create a profile and add your animals with their pedigrees and titles.',
      },
      {
        title: 'Apply',
        text: 'Pick a show from the calendar and submit your entry online in minutes.',
      },
      {
        title: 'Compete',
        text: 'Step into the ring, earn expert grades and well-deserved titles.',
      },
    ],
  },
  faqs: {
    caption: 'Questions & answers',
    title: 'Frequently asked questions',
    items: [
      {
        q: 'What is Show Ring?',
        a: 'An online platform for managing animal shows: breeders run kennel profiles, handlers submit entries, and organizers create events and publish results.',
      },
      {
        q: 'Which animals can I register?',
        a: 'Dogs under RKF / FCI rules for now. We plan to add other species, such as cats, later.',
      },
      {
        q: 'How do I enter a show?',
        a: 'Create a profile, add an animal, open the show calendar and submit your entry in one click. Entry status is visible in your dashboard.',
      },
      {
        q: 'How much does it cost?',
        a: 'Signing up is free. Each show fee is set by its organizer and shown in the event description.',
      },
      {
        q: 'Where can I see results and titles?',
        a: 'Show results, grades and awarded titles are published online and added to your animal’s profile automatically.',
      },
    ],
    contactTitle: 'Still have questions?',
    contactText: 'Describe your case and we’ll help you sort it out.',
    contactCta: 'Contact us',
  },
  seo: {
    title: 'Show Ring — dog shows online',
    paragraphs: [
      'Show Ring is a modern platform for taking part in dog shows under RKF and FCI rules. Show registration, kennel profiles, pedigree and title records, entry submission and result viewing all live in a single dashboard.',
      'Browse the calendar of shows across Russia, pick events in your region and submit entries online. Breeders run kennel and litter pages, handlers prepare animals for the ring, and organizers publish schedules, ring line-ups and final results — with no paperwork and no queues.',
    ],
  },
};
