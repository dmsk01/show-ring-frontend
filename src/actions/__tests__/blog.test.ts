import { it, expect, describe } from 'vitest';

import { mapPostFromApi } from '../blog';

describe('mapPostFromApi', () => {
  it('maps a full PostResponse (snake_case) to IPostItem (camelCase)', () => {
    const result = mapPostFromApi({
      id: 'p1',
      title: 'Hello World',
      slug: 'hello-world',
      description: 'Intro',
      cover_url: 'https://cdn/x.jpg',
      created_at: '2026-06-01T10:00:00Z',
      author: { name: 'Jane', avatar_url: 'https://cdn/a.jpg' },
      total_views: 12,
      total_shares: 3,
      total_comments: 4,
      total_favorites: 5,
      tags: ['dogs', 'shows'],
      publish: 'published',
      updated_at: '2026-06-02T10:00:00Z',
      content: '<p>body</p>',
      meta_title: 'Meta',
      meta_description: 'Meta desc',
      meta_keywords: ['k1'],
      comments: [],
      favorite_person: [{ name: 'Bob', avatarUrl: 'https://cdn/b.jpg' }],
    });

    expect(result).toEqual({
      id: 'p1',
      slug: 'hello-world',
      title: 'Hello World',
      tags: ['dogs', 'shows'],
      publish: 'published',
      content: '<p>body</p>',
      coverUrl: 'https://cdn/x.jpg',
      metaTitle: 'Meta',
      totalViews: 12,
      totalShares: 3,
      description: 'Intro',
      totalComments: 4,
      createdAt: '2026-06-01T10:00:00Z',
      totalFavorites: 5,
      metaKeywords: ['k1'],
      metaDescription: 'Meta desc',
      comments: [],
      author: { name: 'Jane', avatarUrl: 'https://cdn/a.jpg' },
      favoritePerson: [{ name: 'Bob', avatarUrl: 'https://cdn/b.jpg' }],
    });
  });

  it('defaults the heavy fields absent from a PostCard (list/related)', () => {
    const result = mapPostFromApi({
      id: 'p2',
      title: 'Card',
      slug: 'card',
      created_at: '2026-06-01T10:00:00Z',
      author: { name: 'Jane' },
      publish: 'draft',
    });

    expect(result.content).toBe('');
    expect(result.coverUrl).toBe('');
    expect(result.metaTitle).toBe('');
    expect(result.metaDescription).toBe('');
    expect(result.tags).toEqual([]);
    expect(result.metaKeywords).toEqual([]);
    expect(result.comments).toEqual([]);
    expect(result.favoritePerson).toEqual([]);
    expect(result.totalViews).toBe(0);
    expect(result.totalFavorites).toBe(0);
    expect(result.author).toEqual({ name: 'Jane', avatarUrl: '' });
  });

  it('coerces a null cover_url to an empty string', () => {
    const result = mapPostFromApi({
      id: 'p3',
      title: 'No cover',
      slug: 'no-cover',
      cover_url: null,
      created_at: '2026-06-01T10:00:00Z',
      author: { name: 'Jane' },
      publish: 'published',
    });

    expect(result.coverUrl).toBe('');
  });
});
