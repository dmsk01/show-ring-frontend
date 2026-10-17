import { it, vi, expect, describe, afterEach } from 'vitest';

// ----------------------------------------------------------------------
// До публичного запуска сайт закрыт от роботов; открывается флагом
// NEXT_PUBLIC_SITE_INDEXING=true (build-arg, см. Dockerfile).

async function loadRobots() {
  vi.resetModules();
  return (await import('../robots')).default();
}

afterEach(() => vi.unstubAllEnvs());

describe('robots', () => {
  it('disallows everything by default', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_INDEXING', '');

    const robots = await loadRobots();

    expect(robots.rules).toEqual({ userAgent: '*', disallow: '/' });
    expect(robots.sitemap).toBeUndefined();
  });

  it('opens the site and points to the sitemap when indexing is enabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_INDEXING', 'true');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.ru/');

    const robots = await loadRobots();

    expect(robots.sitemap).toBe('https://example.ru/sitemap.xml');
    expect(JSON.stringify(robots.rules)).toContain('GPTBot');
  });

  it('falls back to the default site URL when the build-arg is empty', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_INDEXING', 'true');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');

    const robots = await loadRobots();

    expect(robots.sitemap).toBe('https://showring.app/sitemap.xml');
  });
});
