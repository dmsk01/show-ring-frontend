// next/link and src/global-config read process.env at module-eval time; the
// claude.ai/design runtime is a plain browser page with no `process` global.
// Must be the entry's first import so it evaluates before them.
const g = globalThis as { process?: { env: Record<string, string | undefined> } };
if (typeof g.process === 'undefined') g.process = { env: {} };

export {};
