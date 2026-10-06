import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

// ----------------------------------------------------------------------
// Content Security Policy с nonce (план защиты 2026-10-05, этап 4).
//
// Главная цель — XSS: даже если злоумышленник протащит <script> в HTML
// (через пользовательский контент), браузер его не выполнит — разрешены
// только скрипты с одноразовым nonce этого ответа. Next.js сам ставит nonce
// на свои скрипты, найдя его в заголовке CSP запроса; inline-скрипт темы
// MUI получает его в src/app/layout.tsx через заголовок x-nonce.
//
// Nonce требует динамического рендеринга — корневой layout и так читает
// cookies/заголовки, поэтому все страницы уже динамические.
//
// style-src 'unsafe-inline' — осознанно: MUI/emotion вставляет <style> во
// время работы и пишет атрибуты style, которые nonce не покрывает. Опасность
// инъекции стилей несравнимо ниже, чем скриптов.
//
// CSP_MODE (переменная окружения сервера Next):
//   enforce      — по умолчанию, нарушение блокируется;
//   report-only  — только сообщения в консоль браузера (отладка правил);
//   off          — без CSP (аварийный откат без правки кода).

type CspMode = 'enforce' | 'report-only' | 'off';

function cspMode(): CspMode {
  const mode = process.env.CSP_MODE;
  return mode === 'report-only' || mode === 'off' ? mode : 'enforce';
}

export function buildCsp(nonce: string, { dev, https }: { dev: boolean; https: boolean }) {
  const directives = [
    "default-src 'self'",
    // 'unsafe-eval' — только в dev: React восстанавливает стеки ошибок через eval.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    // blob: — превью загружаемых фото; data: — мелкие встроенные картинки.
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    // API на том же домене (/api); 'self' покрывает и WebSocket того же хоста.
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  // Только на HTTPS: на HTTP-сайте директива переписала бы ресурсы на https
  // и сломала их загрузку.
  if (https) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

export function proxy(request: NextRequest) {
  const mode = cspMode();
  if (mode === 'off') return NextResponse.next();

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const https =
    request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:';
  const csp = buildCsp(nonce, { dev: process.env.NODE_ENV === 'development', https });

  // Next.js берёт nonce из заголовка CSP ЗАПРОСА — ставим его всегда,
  // даже в report-only, чтобы nonce попадал на скрипты.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(
    mode === 'report-only' ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
    csp
  );
  return response;
}

export const config = {
  matcher: [
    // Всё, кроме API (у него свой CSP с бэка), статики и предзагрузок next/link.
    {
      source: '/((?!api|_next/static|_next/image|assets|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
