'use client';

import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ReferenceCrud } from '../reference-crud';
import { REFERENCE_TYPES } from '../reference-config';

// ----------------------------------------------------------------------

export function AdminReferencesView() {
  const { t } = useTranslate(['admin', 'common']);
  const [tab, setTab] = useState(REFERENCE_TYPES[0].key);

  const activeConfig = REFERENCE_TYPES.find((type) => type.key === tab) ?? REFERENCE_TYPES[0];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('reference.list.title')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('breadcrumb.admin') },
          { name: t('reference.list.breadcrumb') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        {REFERENCE_TYPES.map((type) => (
          <Tab
            key={type.key}
            value={type.key}
            label={t(`reference.types.${type.key}.label`)}
          />
        ))}
      </Tabs>

      <ReferenceCrud key={activeConfig.key} config={activeConfig} />
    </DashboardContent>
  );
}
