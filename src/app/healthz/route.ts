// Liveness-проба для HEALTHCHECK образа и nginx depends_on.
// Путь /healthz (не /api) → nginx маршрутизирует на web.
export const dynamic = 'force-static';

export function GET() {
  return new Response('ok', { status: 200 });
}
