import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

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

// On 401: try refresh once, then retry the original request.
let refreshPromise: Promise<string | null> | null = null;

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

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error?.response?.status;

    const isAuthCall = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      // Single-flight: concurrent 401s share one refresh; reset only once it settles.
      refreshPromise = refreshPromise ?? refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;

      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return axiosInstance(original);
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
