'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

type DemoLink = { label: string; href: string };
type DemoGroup = { subheader: string; items: DemoLink[] };

const DEMO_GROUPS: DemoGroup[] = [
  {
    subheader: 'Overview',
    items: [
      { label: 'App', href: paths.dashboard.root },
      { label: 'Ecommerce', href: paths.dashboard.general.ecommerce },
      { label: 'Analytics', href: paths.dashboard.general.analytics },
      { label: 'Banking', href: paths.dashboard.general.banking },
      { label: 'Booking', href: paths.dashboard.general.booking },
      { label: 'File', href: paths.dashboard.general.file },
      { label: 'Course', href: paths.dashboard.general.course },
    ],
  },
  {
    subheader: 'User',
    items: [
      { label: 'Profile', href: paths.dashboard.user.root },
      { label: 'Cards', href: paths.dashboard.user.cards },
      { label: 'List', href: paths.dashboard.user.list },
      { label: 'Create', href: paths.dashboard.user.new },
      { label: 'Edit', href: paths.dashboard.user.demo.edit },
      { label: 'Account', href: paths.dashboard.user.account },
    ],
  },
  {
    subheader: 'Product',
    items: [
      { label: 'List', href: paths.dashboard.product.root },
      { label: 'Details', href: paths.dashboard.product.demo.details },
      { label: 'Create', href: paths.dashboard.product.new },
      { label: 'Edit', href: paths.dashboard.product.demo.edit },
    ],
  },
  {
    subheader: 'Order',
    items: [
      { label: 'List', href: paths.dashboard.order.root },
      { label: 'Details', href: paths.dashboard.order.demo.details },
    ],
  },
  {
    subheader: 'Invoice',
    items: [
      { label: 'List', href: paths.dashboard.invoice.root },
      { label: 'Details', href: paths.dashboard.invoice.demo.details },
      { label: 'Create', href: paths.dashboard.invoice.new },
      { label: 'Edit', href: paths.dashboard.invoice.demo.edit },
    ],
  },
  {
    subheader: 'Blog',
    items: [
      { label: 'List', href: paths.dashboard.post.root },
      { label: 'Details', href: paths.dashboard.post.demo.details },
      { label: 'Create', href: paths.dashboard.post.new },
      { label: 'Edit', href: paths.dashboard.post.demo.edit },
    ],
  },
  {
    subheader: 'Job',
    items: [
      { label: 'List', href: paths.dashboard.job.root },
      { label: 'Details', href: paths.dashboard.job.demo.details },
      { label: 'Create', href: paths.dashboard.job.new },
      { label: 'Edit', href: paths.dashboard.job.demo.edit },
    ],
  },
  {
    subheader: 'Tour',
    items: [
      { label: 'List', href: paths.dashboard.tour.root },
      { label: 'Details', href: paths.dashboard.tour.demo.details },
      { label: 'Create', href: paths.dashboard.tour.new },
      { label: 'Edit', href: paths.dashboard.tour.demo.edit },
    ],
  },
  {
    subheader: 'Apps',
    items: [
      { label: 'File manager', href: paths.dashboard.fileManager },
      { label: 'Mail', href: paths.dashboard.mail },
      { label: 'Chat', href: paths.dashboard.chat },
      { label: 'Calendar', href: paths.dashboard.calendar },
      { label: 'Kanban', href: paths.dashboard.kanban },
    ],
  },
  {
    subheader: 'Misc',
    items: [
      { label: 'Permission', href: paths.dashboard.permission },
      { label: 'Params', href: '/dashboard/params?id=e99f09a7-dd88-49d5-b1c8-1daf80c2d7b1' },
      { label: 'Subpaths', href: '/dashboard/subpaths' },
      { label: 'Blank', href: paths.dashboard.blank },
    ],
  },
];

// ----------------------------------------------------------------------

export function DemoHubView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Demo"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Demo' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        Демо-страницы шаблона Minimal. Убраны из основного меню, но остаются доступны по прямым
        ссылкам до окончательной чистки.
      </Typography>

      <Box
        sx={{
          gap: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        }}
      >
        {DEMO_GROUPS.map((group) => (
          <Card key={group.subheader}>
            <CardHeader
              title={group.subheader}
              action={
                <Label color="warning" variant="soft">
                  DEMO
                </Label>
              }
            />
            <Box sx={{ p: 3, gap: 1, display: 'flex', flexWrap: 'wrap' }}>
              {group.items.map((item) => (
                <Button
                  key={item.label}
                  component={RouterLink}
                  href={item.href}
                  size="small"
                  variant="outlined"
                  color="inherit"
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          </Card>
        ))}
      </Box>
    </DashboardContent>
  );
}
