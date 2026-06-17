import type { NextConfig } from 'next';

// ----------------------------------------------------------------------

/**
 * Static Exports in Next.js
 *
 * 1. Set `isStaticExport = true` in `next.config.{mjs|ts}`.
 * 2. This allows `generateStaticParams()` to pre-render dynamic routes at build time.
 *
 * For more details, see:
 * https://nextjs.org/docs/app/building-your-application/deploying/static-exports
 *
 * NOTE: Remove all "generateStaticParams()" functions if not using static exports.
 */
const isStaticExport = false;

// ----------------------------------------------------------------------

const nextConfig: NextConfig = {
  trailingSlash: true,
  // Don't 308-redirect `/api/*` to a trailing slash — let the rewrite proxy POST/PUT
  // bodies straight through to the backend without an extra redirect round-trip.
  skipTrailingSlashRedirect: true,
  output: isStaticExport ? 'export' : 'standalone',
  // Проверку типов на этапе `next build` отключаем: полный проход tsc по
  // тяжёлому MUI-шаблону пробивает кучу V8 (~2 ГБ) и роняет docker-сборку на
  // сервере по OOM (SIGABRT на фазе "Running TypeScript"). Типы по-прежнему
  // проверяются в CI (`npx tsc --noEmit`, стадия lint в .gitlab-ci.yml), так
  // что страховка от регрессий сохраняется — она просто не на билде.
  // ВРЕМЕННО: вернуть, как только сборка получит достаточно памяти/swap.
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    BUILD_STATIC_EXPORT: JSON.stringify(isStaticExport),
  },
  // Without --turbopack (next dev)
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
  // With --turbopack (next dev --turbopack)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
