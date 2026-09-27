import { it, vi, expect, describe, beforeEach } from 'vitest';

import { createPost, updatePost } from '../blog';

// ----------------------------------------------------------------------

const { axiosMock, mutateMock } = vi.hoisted(() => ({
  axiosMock: { post: vi.fn(), put: vi.fn() },
  mutateMock: vi.fn(),
}));

vi.mock('src/lib/axios', () => ({
  default: axiosMock,
  fetcher: vi.fn(),
  endpoints: {
    post: {
      list: '/posts',
      details: (slug: string) => `/posts/${slug}`,
      related: (slug: string) => `/posts/${slug}/related`,
      update: (id: string) => `/posts/${id}`,
    },
  },
}));

vi.mock('swr', () => ({ default: vi.fn(), mutate: mutateMock }));

const apiPost = (overrides: Record<string, unknown> = {}) => ({
  id: 'p1',
  title: 'Draft post',
  slug: 'draft-post',
  created_at: '2026-06-01T10:00:00Z',
  author: { name: 'Jane' },
  publish: 'draft',
  ...overrides,
});

const payload = {
  title: 'Draft post',
  description: 'Intro',
  content: '<p>body</p>',
  cover_url: null,
  tags: ['a', 'b'],
  meta_keywords: ['k'],
  meta_title: null,
  meta_description: null,
  publish: 'draft' as const,
};

describe('blog mutations', () => {
  beforeEach(() => {
    axiosMock.post.mockReset();
    axiosMock.put.mockReset();
    mutateMock.mockReset();
  });

  it('createPost sends publish to POST /posts and revalidates lists', async () => {
    axiosMock.post.mockResolvedValue({ data: apiPost() });

    const post = await createPost(payload);

    expect(axiosMock.post).toHaveBeenCalledWith('/posts', payload);
    expect(post.publish).toBe('draft');
    const [matcher] = mutateMock.mock.calls[0];
    expect(matcher(['/posts', { params: {} }])).toBe(true);
    expect(matcher('/posts/draft-post')).toBe(false);
  });

  it('updatePost PUTs by id and refreshes the detail cache by slug', async () => {
    const data = apiPost({ publish: 'published' });
    axiosMock.put.mockResolvedValue({ data });

    const post = await updatePost('p1', { publish: 'published' }, 'draft-post');

    expect(axiosMock.put).toHaveBeenCalledWith('/posts/p1', { publish: 'published' });
    expect(post.publish).toBe('published');
    expect(mutateMock).toHaveBeenCalledWith('/posts/draft-post', data, { revalidate: false });
  });

  it('updatePost drops the stale detail when the slug changed', async () => {
    axiosMock.put.mockResolvedValue({ data: apiPost({ slug: 'new-slug', title: 'New' }) });

    await updatePost('p1', { title: 'New' }, 'draft-post');

    expect(mutateMock).toHaveBeenCalledWith('/posts/draft-post', undefined, { revalidate: false });
    expect(mutateMock).toHaveBeenCalledWith(
      '/posts/new-slug',
      expect.objectContaining({ slug: 'new-slug' }),
      { revalidate: false }
    );
  });
});
