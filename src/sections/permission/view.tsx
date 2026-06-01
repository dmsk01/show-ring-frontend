'use client';

import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { ForbiddenIllustration } from 'src/assets/illustrations';

import { Can } from 'src/components/can';
import { varBounce, MotionContainer } from 'src/components/animate';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const denied = (
  <Container component={MotionContainer} sx={{ textAlign: 'center' }}>
    <m.div variants={varBounce('in')}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Permission denied
      </Typography>
    </m.div>

    <m.div variants={varBounce('in')}>
      <Typography sx={{ color: 'text.secondary' }}>
        You do not have permission to access this page.
      </Typography>
    </m.div>

    <m.div variants={varBounce('in')}>
      <ForbiddenIllustration sx={{ my: { xs: 5, sm: 10 } }} />
    </m.div>
  </Container>
);

export function PermissionDeniedView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Permission"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Permission' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Can permission="dashboard:view" fallback={denied}>
        <Box sx={{ gap: 3, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {Array.from({ length: 8 }, (_, index) => (
            <Card key={index}>
              <CardHeader title={`Card ${index + 1}`} subheader="Proin viverra ligula" />

              <Typography variant="body2" sx={{ px: 3, py: 2, color: 'text.secondary' }}>
                Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. In enim justo,
                rhoncus ut, imperdiet a, venenatis vitae, justo. Vestibulum fringilla pede sit amet
                augue.
              </Typography>
            </Card>
          ))}
        </Box>
      </Can>
    </DashboardContent>
  );
}
