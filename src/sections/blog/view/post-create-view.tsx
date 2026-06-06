'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PostCreateEditForm } from '../post-create-edit-form';

// ----------------------------------------------------------------------

export function PostCreateView() {
  const { t } = useTranslate(['blog', 'common']);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('form.headingCreate')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.post.root },
          { name: t('form.headingCreate') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PostCreateEditForm />
    </DashboardContent>
  );
}
