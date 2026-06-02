'use client';

import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ReferenceCrud } from '../reference-crud';
import { REFERENCE_TYPES } from '../reference-config';

// ----------------------------------------------------------------------

export function AdminReferencesView() {
  const [tab, setTab] = useState(REFERENCE_TYPES[0].key);

  const activeConfig = REFERENCE_TYPES.find((t) => t.key === tab) ?? REFERENCE_TYPES[0];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="References"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Admin' },
          { name: 'References' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        {REFERENCE_TYPES.map((type) => (
          <Tab key={type.key} value={type.key} label={type.label} />
        ))}
      </Tabs>

      <ReferenceCrud key={activeConfig.key} config={activeConfig} />
    </DashboardContent>
  );
}
