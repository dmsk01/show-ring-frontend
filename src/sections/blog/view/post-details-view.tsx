'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { apiErrorMessageKey } from 'src/utils/api-error';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetPost, updatePost } from 'src/actions/blog';

import { toast } from 'src/components/snackbar';
import { Markdown } from 'src/components/markdown';

import { POST_PUBLISH_OPTIONS } from '../constants';
import { PostDetailsHero } from '../post-details-hero';
import { PostDetailsToolbar } from '../post-details-toolbar';

// ----------------------------------------------------------------------

type Props = {
  title: string;
};

export function PostDetailsView({ title }: Props) {
  const { post } = useGetPost(title);
  const { t } = useTranslate(['blog', 'common']);

  const [publish, setPublish] = useState('');

  const handleChangePublish = useCallback(
    async (newValue: string) => {
      if (!post || newValue === post.publish) return;
      // Optimistic: flip the toolbar right away, roll back if the PUT fails.
      setPublish(newValue);
      try {
        await updatePost(post.id, { publish: newValue as 'published' | 'draft' });
        toast.success(newValue === 'published' ? t('toast.published') : t('toast.draftSaved'));
      } catch (error) {
        setPublish(post.publish);
        toast.error(t(apiErrorMessageKey(error, {}, 'common:state.error')));
      }
    },
    [post, t]
  );

  useEffect(() => {
    if (post) {
      setPublish(post?.publish);
    }
  }, [post]);

  return (
    <DashboardContent maxWidth={false} disablePadding>
      <Container maxWidth={false} sx={{ px: { sm: 5 } }}>
        <PostDetailsToolbar
          backHref={paths.dashboard.post.root}
          editHref={paths.dashboard.post.edit(`${post?.slug}`)}
          liveHref={paths.post.details(`${post?.slug}`)}
          publish={`${publish}`}
          onChangePublish={handleChangePublish}
          publishOptions={POST_PUBLISH_OPTIONS}
        />
      </Container>

      <PostDetailsHero title={`${post?.title}`} coverUrl={`${post?.coverUrl}`} />

      <Box
        sx={{
          pb: 5,
          mx: 'auto',
          maxWidth: 720,
          mt: { xs: 5, md: 10 },
          px: { xs: 2, sm: 3 },
        }}
      >
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
      </Box>
    </DashboardContent>
  );
}
