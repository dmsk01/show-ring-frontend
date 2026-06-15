import type { AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import axios from 'axios';
import i18next from 'i18next';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { fallbackLng } from 'src/locales/locales-config';

// ----------------------------------------------------------------------

declare module 'axios' {
  // Внутренние флаги интерсептора, переносимые на конфиге запроса.
  export interface AxiosRequestConfig {
    _retry?: boolean;
    // Не редиректить на логин при провале refresh — для загрузочного пробника
    // сессии (/users/me на старте у анонима).
    _skipAuthRedirect?: boolean;
  }
}

/** Error carrying the raw axios response so callers can read status/body/headers. */
export type ApiError = Error & {
  status?: number;
  response?: AxiosResponse;
};

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl, // '/api' → proxied to backend by Next.js rewrites
  headers: { 'Content-Type': 'application/json' },
  // Cookie-режим: бэкенд отдаёт access/refresh в httpOnly-куках (JS их не
  // читает). withCredentials заставляет браузер слать куки с каждым запросом
  // (и принимать Set-Cookie). Авторизация больше не вешается заголовком из
  // localStorage — access-кука уходит автоматически.
  withCredentials: true,
});

// Accept-Language tells the backend which locale to localize reference data
// to (/references/*); harmless for other endpoints. Falls back to 'ru' until
// i18next is initialized (matches its fallbackLng).
axiosInstance.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = i18next.resolvedLanguage ?? fallbackLng;
  return config;
});

// Refresh failed mid-session: tokens are already cleared — send the user to
// sign-in (preserving returnTo) instead of leaving them stuck on a dead page.
function redirectToSignIn(): void {
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  if (pathname.startsWith('/auth/')) return; // already on an auth page — avoid loop
  const returnTo = `${pathname}${search}`;
  const queryString = new URLSearchParams({ returnTo }).toString();
  window.location.href = `${paths.auth.jwt.signIn}?${queryString}`;
}

// ----------------------------------------------------------------------
// 401 handling: a single in-flight refresh guarded by `isRefreshing`. Any
// request that fails with 401 while a refresh is running is parked in
// `pendingQueue` instead of firing its own refresh. When the refresh settles
// the queue is flushed — every parked request is replayed against the fresh
// access cookie (success) or rejected and the user is sent to sign-in (failure).
//
// Cookie-режим: и access, и refresh — в httpOnly-куках. Refresh не передаёт
// токен в теле (его несёт refresh-кука, path=/api/auth), а ретрай просто
// переотправляет исходный запрос — свежая access-кука уйдёт автоматически.

type QueuedRequest = {
  resolve: () => void;
  reject: (reason: unknown) => void;
};

let isRefreshing = false;
let pendingQueue: QueuedRequest[] = [];

function flushQueue(error: unknown, success: boolean): void {
  pendingQueue.forEach(({ resolve, reject }) => (success ? resolve() : reject(error)));
  pendingQueue = [];
}

async function refreshSession(): Promise<boolean> {
  try {
    // Тело пустое — refresh-кука уходит автоматически (withCredentials).
    // Бэкенд ставит свежие access/refresh куки в ответе.
    await axios.post(`${CONFIG.serverUrl}${endpoints.auth.refresh}`, {}, { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig | undefined;
    const status = error?.response?.status;

    const isAuthCall = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;

      // A refresh is already in flight: park this request until it settles,
      // then replay it (or reject it if the refresh failed).
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => axiosInstance(original));
      }

      // This request owns the refresh for the current wave of 401s.
      isRefreshing = true;
      try {
        const ok = await refreshSession();
        if (!ok) {
          // Refresh failed — release the queue with the error and re-auth.
          flushQueue(error, false);
          if (!original._skipAuthRedirect) redirectToSignIn();
        } else {
          flushQueue(null, true);
          return await axiosInstance(original);
        }
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Something went wrong!';

    // Keep the raw status + response on the rejected Error (additive — `message`
    // is unchanged, so existing `error.message` readers are unaffected). Lets
    // callers read structured bodies/headers the flattening would otherwise drop
    // (e.g. upload 429 `reset_at` / 503 `Retry-After`).
    const apiError: ApiError = new Error(typeof message === 'string' ? message : 'Request failed');
    apiError.status = status;
    apiError.response = error?.response;
    return Promise.reject(apiError);
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async <T = unknown>(
  args: string | [string, AxiosRequestConfig]
): Promise<T> => {
  const [url, config] = Array.isArray(args) ? args : [args, {}];
  const res = await axiosInstance.get<T>(url, config);
  return res.data;
};

// ----------------------------------------------------------------------

export const endpoints = {
  // --- ShowTail backend ---
  featureFlags: '/feature-flags',
  auth: {
    me: '/users/me',
    myDogs: '/users/me/dogs',
    profile: '/users/me/profile',
    socials: '/users/me/socials',
    password: '/users/me/password',
    signIn: '/auth/login',
    signUp: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    confirmEmailChange: '/auth/confirm-email-change',
  },
  dog: {
    list: '/dogs',
    details: (id: string) => `/dogs/${id}`,
    pedigree: (id: string) => `/dogs/${id}/pedigree`,
    titles: (id: string) => `/dogs/${id}/titles`,
    images: (id: string) => `/dogs/${id}/images`,
    image: (id: string, fileId: string) => `/dogs/${id}/images/${fileId}`,
  },
  kennel: {
    list: '/kennels',
    details: (id: string) => `/kennels/${id}`,
  },
  litter: {
    list: '/litters',
    details: (id: string) => `/litters/${id}`,
    puppies: (id: string) => `/litters/${id}/puppies`,
  },
  file: {
    upload: '/files/upload',
    details: (id: string) => `/files/${id}`,
  },
  classified: {
    list: '/classifieds',
    mine: '/classifieds/mine',
    search: '/classifieds/search',
    details: (id: string) => `/classifieds/${id}`,
  },
  show: {
    list: '/shows',
    details: (id: string) => `/shows/${id}`,
    status: (id: string) => `/shows/${id}/status`,
    publish: (id: string) => `/shows/${id}/publish`,
    entries: (id: string) => `/shows/${id}/entries`,
    myEntries: (id: string) => `/shows/${id}/entries/my`,
    myShowsList: '/shows/entries/my',
    entryItem: (id: string, entryId: string) => `/shows/${id}/entries/${entryId}`,
    availableClasses: (id: string, dogId: string) =>
      `/shows/${id}/available-classes/${dogId}`,
    results: (id: string) => `/shows/${id}/results`,
    resultItem: (id: string, resultId: string) => `/shows/${id}/results/${resultId}`,
    catalogGenerate: (id: string) => `/shows/${id}/catalog/generate`,
    diplomasGenerate: (id: string) => `/shows/${id}/diplomas/generate`,
    rings: (id: string) => `/shows/${id}/rings`,
    documentsReadiness: (id: string) => `/shows/${id}/documents/readiness`,
    officialDoc: (id: string, kind: string) => `/shows/${id}/official/${kind}`,
    officialContext: (id: string, kind: string) => `/shows/${id}/official/${kind}/context`,
    entryOfficialDoc: (id: string, entryId: string, kind: string) =>
      `/shows/${id}/entries/${entryId}/official/${kind}`,
  },
  task: {
    details: (id: string) => `/tasks/${id}`,
    download: (id: string) => `/tasks/${id}/download`,
  },
  ad: {
    campaigns: '/ads/campaigns',
    campaign: (id: string) => `/ads/campaigns/${id}`,
    campaignBanners: (id: string) => `/ads/campaigns/${id}/banners`,
    campaignStats: (id: string) => `/ads/campaigns/${id}/stats`,
  },
  support: {
    tickets: '/support/tickets',
    ticket: (id: string) => `/support/tickets/${id}`,
    messages: (id: string) => `/support/tickets/${id}/messages`,
    ticketStatus: (id: string) => `/support/tickets/${id}/status`,
  },
  notification: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    markRead: (id: string) => `/notifications/${id}/read`,
    readAll: '/notifications/read-all',
    subscriptions: '/subscriptions',
    subscription: (id: string) => `/subscriptions/${id}`,
  },
  admin: {
    users: '/admin/users',
    userBlock: (id: string) => `/admin/users/${id}/block`,
    userRole: (id: string) => `/admin/users/${id}/role`,
    moderationClassifieds: '/admin/moderation/classifieds',
    moderationClassified: (id: string) => `/admin/moderation/classifieds/${id}`,
    moderationKennels: '/admin/moderation/kennels',
    kennelVerify: (id: string) => `/admin/moderation/kennels/${id}/verify`,
    analyticsDashboard: '/admin/analytics/dashboard',
    analyticsAds: '/admin/analytics/ads',
    analyticsTopBreeds: '/admin/analytics/top-breeds',
    analyticsTopCampaigns: '/admin/analytics/top-campaigns',
  },
  reference: {
    breeds: '/references/breeds',
    kennels: '/kennels',
  },
  // --- Minimal Kit demo endpoints (parked; kept so demo actions keep compiling) ---
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  // Blog — backed by ShowTail (see docs/specs). baseURL '/api' + these →
  // proxied to the backend (e.g. /api/posts → :8000/posts). Posts are keyed
  // by `slug`; full-text search folds into the list endpoint via `?query=`.
  post: {
    list: '/posts',
    details: (slug: string) => `/posts/${slug}`,
    related: (slug: string) => `/posts/${slug}/related`,
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
} as const;
