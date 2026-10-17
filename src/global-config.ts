import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

// ----------------------------------------------------------------------

export type ConfigValue = {
  appName: string;
  /** Публичный адрес сайта — для sitemap.xml и robots.txt. */
  siteUrl: string;
  /** Разрешена ли индексация сайта роботами. */
  siteIndexing: boolean;
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
  appName: 'BisShow',
  // `||`, а не `??`: в Docker-сборку адрес приходит build-arg'ом, и незаданный
  // аргумент превращается в пустую строку, а не в undefined.
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'https://showring.app').replace(/\/$/, ''),
  // До публичного запуска сайт скрыт от поисковиков и AI-краулеров
  // (robots.txt, meta robots, X-Robots-Tag). Открыть — только явным 'true'.
  siteIndexing: process.env.NEXT_PUBLIC_SITE_INDEXING === 'true',
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
