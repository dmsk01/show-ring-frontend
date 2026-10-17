import { it, expect, describe } from 'vitest';

import { buildCsp } from '../proxy';

// ----------------------------------------------------------------------

describe('buildCsp', () => {
  it('allows only nonced scripts in production', () => {
    const csp = buildCsp('abc123', { dev: false, https: true });
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    // Отчёты о нарушениях уходят на бэкенд (app/routers/csp_report.py).
    expect(csp).toContain('report-uri /api/csp-report');
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('adds unsafe-eval only in development', () => {
    expect(buildCsp('n', { dev: true, https: false })).toContain("'unsafe-eval'");
  });

  it('does not upgrade requests on plain http', () => {
    // На HTTP-сайте upgrade-insecure-requests сломал бы загрузку ресурсов.
    expect(buildCsp('n', { dev: false, https: false })).not.toContain('upgrade-insecure-requests');
  });
});
