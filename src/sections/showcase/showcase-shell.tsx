import type { ReactNode } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type Props = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function ShowcaseShell({ title, action, children }: Props) {
  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      {(title || action) && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: { xs: 3, md: 5 } }}
        >
          {title && <Typography variant="h3">{title}</Typography>}
          {action}
        </Stack>
      )}
      {children}
    </Container>
  );
}
