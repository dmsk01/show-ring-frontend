'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetPost, useGetLatestPosts } from 'src/actions/blog';

import { Markdown } from 'src/components/markdown';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PostItem } from '../post-item';
import { PostDetailsHero } from '../post-details-hero';

// ----------------------------------------------------------------------

type Props = {
  title: string;
};

export function PostDetailsHomeView({ title }: Props) {
  const { post } = useGetPost(title);
  const { latestPosts } = useGetLatestPosts(title);
  const { t } = useTranslate(['blog', 'common']);

  return (
    <>
      <PostDetailsHero
        title={post?.title ?? ''}
        author={post?.author}
        coverUrl={post?.coverUrl ?? ''}
        createdAt={post?.createdAt}
      />

      <Container
        maxWidth={false}
        sx={[
          (theme) => ({ py: 3, mb: 5, borderBottom: `solid 1px ${theme.vars.palette.divider}` }),
        ]}
      >
        <CustomBreadcrumbs
          links={[
            { name: t('detail.home'), href: '/' },
            { name: t('list.title'), href: paths.post.root },
            { name: post?.title },
          ]}
          sx={{ maxWidth: 720, mx: 'auto' }}
        />
      </Container>

      <Container maxWidth={false}>
        <Stack sx={{ maxWidth: 720, mx: 'auto' }}>
          <Typography variant="subtitle1">{post?.description}</Typography>

          <Markdown children={post?.content} />

          <Stack
            spacing={3}
            sx={[
              (theme) => ({
                py: 3,
                borderTop: `dashed 1px ${theme.vars.palette.divider}`,
                borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
              }),
            ]}
          >
            <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap' }}>
              {post?.tags.map((tag) => (
                <Chip key={tag} label={tag} variant="soft" />
              ))}
            </Box>
          </Stack>
        </Stack>
      </Container>

      {!!latestPosts?.length && (
        <Container sx={{ pb: 15 }}>
          <Typography variant="h4" sx={{ mb: 5 }}>
            {t('detail.recentPosts')}
          </Typography>

          <Grid container spacing={3}>
            {latestPosts?.slice(latestPosts.length - 4).map((latestPost) => (
              <Grid
                key={latestPost.id}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4,
                  lg: 3,
                }}
              >
                <PostItem post={latestPost} detailsHref={paths.post.details(latestPost.slug)} />
              </Grid>
            ))}
          </Grid>
        </Container>
      )}
    </>
  );
}
