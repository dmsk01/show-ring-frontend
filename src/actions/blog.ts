import type { SWRConfiguration } from 'swr';
import type { IPostItem, IPostComment } from 'src/types/blog';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// Pull the whole catalogue in one shot: the list view filters/sorts client-side
// and shows per-status tab counts, so it needs every post at once.
const LIST_PER_PAGE = 100;

// ----------------------------------------------------------------------
// Backend (ShowTail) wire shapes — snake_case. `ApiPostCard` is what list and
// related endpoints return; `ApiPost` adds the heavy `content`/meta/comments
// fields served by GET /posts/{slug}.

type ApiAuthor = { name: string; avatar_url?: string };

type ApiPostCard = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  cover_url?: string | null;
  created_at: string;
  author: ApiAuthor;
  total_views?: number;
  total_shares?: number;
  total_comments?: number;
  total_favorites?: number;
  tags?: string[];
  publish: 'published' | 'draft';
};

type ApiPost = ApiPostCard & {
  updated_at?: string;
  content?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string[];
  comments?: IPostComment[];
  favorite_person?: { name: string; avatarUrl: string }[];
};

type ApiPostPage = {
  items: ApiPostCard[];
  total: number;
  page: number;
  per_page: number;
};

// ----------------------------------------------------------------------
// Pure adapter: snake_case wire post → the camelCase IPostItem the Minimal Kit
// blog views consume. List/related cards omit the heavy fields, so everything
// beyond the card is defaulted. Kept pure and exported for unit testing.

export function mapPostFromApi(raw: ApiPostCard | ApiPost): IPostItem {
  const full = raw as ApiPost;

  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    tags: raw.tags ?? [],
    publish: raw.publish,
    content: full.content ?? '',
    coverUrl: raw.cover_url ?? '',
    metaTitle: full.meta_title ?? '',
    totalViews: raw.total_views ?? 0,
    totalShares: raw.total_shares ?? 0,
    description: raw.description ?? '',
    totalComments: raw.total_comments ?? 0,
    createdAt: raw.created_at,
    totalFavorites: raw.total_favorites ?? 0,
    metaKeywords: full.meta_keywords ?? [],
    metaDescription: full.meta_description ?? '',
    comments: full.comments ?? [],
    author: { name: raw.author.name, avatarUrl: raw.author.avatar_url ?? '' },
    favoritePerson: full.favorite_person ?? [],
  };
}

// ----------------------------------------------------------------------

export function useGetPosts() {
  const key: [string, { params: Record<string, unknown> }] = [
    endpoints.post.list,
    { params: { per_page: LIST_PER_PAGE } },
  ];

  const { data, isLoading, error, isValidating } = useSWR<ApiPostPage>(key, fetcher, swrOptions);

  return useMemo(() => {
    const posts = (data?.items ?? []).map(mapPostFromApi);
    return {
      posts,
      postsLoading: isLoading,
      postsError: error,
      postsValidating: isValidating,
      postsEmpty: !isLoading && !posts.length,
    };
  }, [data, error, isLoading, isValidating]);
}

// ----------------------------------------------------------------------

export function useGetPost(slug: string) {
  const key = slug ? endpoints.post.details(slug) : '';

  const { data, isLoading, error, isValidating } = useSWR<ApiPost>(key, fetcher, swrOptions);

  return useMemo(
    () => ({
      post: data ? mapPostFromApi(data) : undefined,
      postLoading: isLoading,
      postError: error,
      postValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export function useGetLatestPosts(slug: string) {
  const key = slug ? endpoints.post.related(slug) : '';

  const { data, isLoading, error, isValidating } = useSWR<ApiPostCard[]>(key, fetcher, swrOptions);

  return useMemo(() => {
    const latestPosts = (data ?? []).map(mapPostFromApi);
    return {
      latestPosts,
      latestPostsLoading: isLoading,
      latestPostsError: error,
      latestPostsValidating: isValidating,
      latestPostsEmpty: !isLoading && !latestPosts.length,
    };
  }, [data, error, isLoading, isValidating]);
}

// ----------------------------------------------------------------------

export function useSearchPosts(query: string) {
  const key: [string, { params: Record<string, unknown> }] | '' = query
    ? [endpoints.post.list, { params: { query, per_page: LIST_PER_PAGE } }]
    : '';

  const { data, isLoading, error, isValidating } = useSWR<ApiPostPage>(key, fetcher, {
    ...swrOptions,
    keepPreviousData: true,
  });

  return useMemo(() => {
    const searchResults = (data?.items ?? []).map(mapPostFromApi);
    return {
      searchResults,
      searchLoading: isLoading,
      searchError: error,
      searchValidating: isValidating,
      searchEmpty: !isLoading && !isValidating && !searchResults.length,
    };
  }, [data, error, isLoading, isValidating]);
}
