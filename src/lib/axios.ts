import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { JWT_STORAGE_KEY, JWT_REFRESH_STORAGE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl, // '/api' → proxied to backend by Next.js rewrites
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer on every request (survives token refresh, unlike axios.defaults).
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem(JWT_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
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
// the queue is flushed — every parked request is replayed with the fresh token
// (success) or rejected and the user is sent to sign-in (failure).

type RetryableConfig = AxiosRequestConfig & { _retry?: boolean };

type QueuedRequest = {
  resolve: (token: string) => void;
  reject: (reason: unknown) => void;
};

let isRefreshing = false;
let pendingQueue: QueuedRequest[] = [];

function flushQueue(error: unknown, token: string | null): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  pendingQueue = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken =
    typeof window !== 'undefined' ? sessionStorage.getItem(JWT_REFRESH_STORAGE_KEY) : null;
  if (!refreshToken) return null;

  try {
    const res = await axios.post(`${CONFIG.serverUrl}${endpoints.auth.refresh}`, {
      refresh_token: refreshToken,
    });
    const { access_token, refresh_token } = res.data;
    sessionStorage.setItem(JWT_STORAGE_KEY, access_token);
    if (refresh_token) sessionStorage.setItem(JWT_REFRESH_STORAGE_KEY, refresh_token);
    return access_token;
  } catch {
    sessionStorage.removeItem(JWT_STORAGE_KEY);
    sessionStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
    return null;
  }
}

// Replay a request with the refreshed bearer token.
function retryWithToken(original: RetryableConfig, token: string) {
  original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
  return axiosInstance(original);
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error?.response?.status;

    const isAuthCall = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;

      // A refresh is already in flight: park this request until it settles,
      // then replay it (or reject it if the refresh failed).
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => retryWithToken(original, token));
      }

      // This request owns the refresh for the current wave of 401s.
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          // Refresh failed — release the queue with the error and re-auth.
          flushQueue(error, null);
          redirectToSignIn();
        } else {
          flushQueue(null, newToken);
          return await retryWithToken(original, newToken);
        }
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Something went wrong!';
    return Promise.reject(new Error(typeof message === 'string' ? message : 'Request failed'));
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
  auth: {
    me: '/users/me',
    profile: '/users/me/profile',
    signIn: '/auth/login',
    signUp: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  dog: {
    list: '/dogs',
    details: (id: string) => `/dogs/${id}`,
    pedigree: (id: string) => `/dogs/${id}/pedigree`,
    titles: (id: string) => `/dogs/${id}/titles`,
  },
  kennel: {
    list: '/kennels',
    details: (id: string) => `/kennels/${id}`,
  },
  litter: {
    list: '/litters',
    details: (id: string) => `/litters/${id}`,
  },
  file: {
    upload: '/files/upload',
    details: (id: string) => `/files/${id}`,
  },
  classified: {
    list: '/classifieds',
    search: '/classifieds/search',
    details: (id: string) => `/classifieds/${id}`,
  },
  show: {
    list: '/shows',
    details: (id: string) => `/shows/${id}`,
    status: (id: string) => `/shows/${id}/status`,
    publish: (id: string) => `/shows/${id}/publish`,
    entries: (id: string) => `/shows/${id}/entries`,
    results: (id: string) => `/shows/${id}/results`,
    resultItem: (id: string, resultId: string) => `/shows/${id}/results/${resultId}`,
    catalogGenerate: (id: string) => `/shows/${id}/catalog/generate`,
    diplomasGenerate: (id: string) => `/shows/${id}/diplomas/generate`,
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
    markRead: (id: string) => `/notifications/${id}/read`,
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
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
} as const;
