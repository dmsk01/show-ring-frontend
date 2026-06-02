'use client';

import { paths } from 'src/routes/paths';

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

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        backHref={paths.dashboard.post.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Blog', href: paths.dashboard.post.root },
          { name: post?.title },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PostCreateEditForm currentPost={post} />
    </DashboardContent>
  );
}
