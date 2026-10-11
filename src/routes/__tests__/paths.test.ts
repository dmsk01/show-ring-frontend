import { it, expect, describe } from 'vitest';

import { paths } from '../paths';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-12: slug от бэкенда повторно прогонялся
// через kebabCase, и «post-v2» превращался в «post-v-2» → 404.

describe('post paths', () => {
  it('use the backend slug as is', () => {
    expect(paths.post.details('post-v2')).toBe('/post/post-v2');
    expect(paths.post.details('moskva2026')).toBe('/post/moskva2026');
    expect(paths.dashboard.post.details('post-v2')).toBe('/dashboard/post/post-v2');
    expect(paths.dashboard.post.edit('post-v2')).toBe('/dashboard/post/post-v2/edit');
  });
});
