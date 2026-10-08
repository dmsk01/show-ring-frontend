import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

// ----------------------------------------------------------------------

export type ConfigValue = {
  appName: string;
  /** Публичный адрес сайта — для sitemap.xml и robots.txt. */
  siteUrl: string;
  appVersion: string;
  serverUrl: string;
  assetsDir: string;
  isStaticExport: boolean;
  auth: {
    // Единственный способ — свой бэкенд (httpOnly-куки). Провайдеры шаблона
    // (Firebase/Amplify/Auth0/Supabase) удалены вместе с их SDK.
    method: 'jwt';
    skip: boolean;
    redirectPath: string;
  };
};

// ----------------------------------------------------------------------

export const CONFIG: ConfigValue = {
  appName: 'Show Ring',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://showring.app').replace(/\/$/, ''),
  appVersion: packageJson.version,
  serverUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? '/api',
  assetsDir: process.env.NEXT_PUBLIC_ASSETS_DIR ?? '',
  isStaticExport: JSON.parse(process.env.BUILD_STATIC_EXPORT ?? 'false'),
  /**
   * Auth
   * @method jwt
   */
  auth: {
    method: 'jwt',
    skip: false,
    redirectPath: paths.dashboard.root,
  },
};
