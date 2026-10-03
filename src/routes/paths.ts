import { kebabCase } from 'es-toolkit';

// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  comingSoon: '/coming-soon',
  maintenance: '/maintenance',
  about: '/about-us',
  contact: '/contact-us',
  faqs: '/faqs',
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',
  legal: {
    privacy: '/legal/privacy-policy.html',
    terms: '/legal/terms-of-service.html',
    consent: '/legal/consent.html',
  },
  post: {
    root: `/post`,
    details: (title: string) => `/post/${kebabCase(title)}`,
  },
  showcase: {
    kennels: `/kennels`,
    kennel: (id: string) => `/kennels/${id}`,
    animals: `/animals`,
    classified: (id: string) => `/animals/${id}`,
    shows: `/shows`,
    show: (id: string) => `/shows/${id}`,
    showRegister: (id: string) => `/shows/${id}/register`,
    dog: (id: string) => `/dogs/${id}`,
    litter: (id: string) => `/litters/${id}`,
  },
  // AUTH
  auth: {
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    dogs: {
      root: `${ROOTS.DASHBOARD}/dogs`,
      new: `${ROOTS.DASHBOARD}/dogs/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/dogs/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/dogs/${id}/edit`,
    },
    kennels: {
      root: `${ROOTS.DASHBOARD}/kennels`,
      new: `${ROOTS.DASHBOARD}/kennels/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/kennels/${id}/edit`,
    },
    litters: {
      root: `${ROOTS.DASHBOARD}/litters`,
      new: `${ROOTS.DASHBOARD}/litters/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/litters/${id}/edit`,
    },
    classifieds: {
      root: `${ROOTS.DASHBOARD}/classifieds`,
      new: `${ROOTS.DASHBOARD}/classifieds/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/classifieds/${id}/edit`,
    },
    shows: {
      root: `${ROOTS.DASHBOARD}/shows`,
      new: `${ROOTS.DASHBOARD}/shows/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/shows/${id}/edit`,
      results: (id: string) => `${ROOTS.DASHBOARD}/shows/${id}/results`,
      documents: (id: string) => `${ROOTS.DASHBOARD}/shows/${id}/documents`,
    },
    myShows: {
      root: `${ROOTS.DASHBOARD}/my-shows`,
      details: (id: string) => `${ROOTS.DASHBOARD}/my-shows/${id}`,
    },
    myDogs: {
      root: `${ROOTS.DASHBOARD}/my-dogs`,
    },
    ads: {
      root: `${ROOTS.DASHBOARD}/ads`,
      new: `${ROOTS.DASHBOARD}/ads/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/ads/${id}/edit`,
    },
    support: {
      root: `${ROOTS.DASHBOARD}/support`,
      new: `${ROOTS.DASHBOARD}/support/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/support/${id}`,
    },
    notifications: `${ROOTS.DASHBOARD}/notifications`,
    adminReferences: `${ROOTS.DASHBOARD}/admin/references`,
    adminUsers: `${ROOTS.DASHBOARD}/admin/users`,
    adminModeration: `${ROOTS.DASHBOARD}/admin/moderation`,
    adminAnalytics: `${ROOTS.DASHBOARD}/admin/analytics`,
    adminSystem: `${ROOTS.DASHBOARD}/admin/system`,
    profile: `${ROOTS.DASHBOARD}/profile`,
    post: {
      root: `${ROOTS.DASHBOARD}/post`,
      new: `${ROOTS.DASHBOARD}/post/new`,
      details: (title: string) => `${ROOTS.DASHBOARD}/post/${kebabCase(title)}`,
      edit: (title: string) => `${ROOTS.DASHBOARD}/post/${kebabCase(title)}/edit`,
    },
  },
};
