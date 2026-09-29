// Emits .design-sync/pkg/types/ - the .d.ts tree design-sync reads component props from.
// tsc keeps the app's `src/*` path-alias specifiers verbatim; the converter's
// ts-morph pass has no path mapping, so rewrite them to relative paths, and
// hoist the entry declaration to types/index.d.ts (tsc mirrors rootDir, and the
// converter's glob skips the dot-dir tsc would put it in).
// Run from the frontend root: node .design-sync/build-types.mjs

import { execSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { rmSync, mkdirSync, statSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const TYPES = '.design-sync/pkg/types';

mkdirSync(TYPES, { recursive: true });
// Empty (not remove) the dir: a shell may hold it as its cwd on Windows.
for (const n of readdirSync(TYPES)) rmSync(join(TYPES, n), { recursive: true, force: true });
execSync('npx tsc -p .design-sync/pkg/tsconfig.json', { stdio: 'inherit' });

const emittedEntry = join(TYPES, '.design-sync/pkg/index.d.ts');
writeFileSync(join(TYPES, 'index.d.ts'), readFileSync(emittedEntry, 'utf8'));
rmSync(join(TYPES, '.design-sync'), { recursive: true, force: true });

const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.d.ts') ? [p] : [];
  });

let rewritten = 0;
for (const file of walk(TYPES)) {
  const text = readFileSync(file, 'utf8');
  const next = text.replace(/(['"])src\/([^'"]+)\1/g, (_, q, rest) => {
    let rel = relative(dirname(file), join(TYPES, 'src', rest)).split('\\').join('/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return `${q}${rel}${q}`;
  });
  if (next !== text) {
    writeFileSync(file, next);
    rewritten += 1;
  }
}
console.log(`types: ${walk(TYPES).length} .d.ts files, ${rewritten} with rewritten src/ imports`);
