'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetPost } from 'src/actions/blog';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PostCreateEditForm } from '../post-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  title: string;
};

export function PostEditView({ title }: Props) {
  const { post } = useGetPost(title);
  const { t } = useTranslate(['blog', 'common']);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('form.headingEdit')}
        backHref={paths.dashboard.post.root}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.post.root },
          { name: post?.title },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PostCreateEditForm currentPost={post} />
    </DashboardContent>
  );
}
