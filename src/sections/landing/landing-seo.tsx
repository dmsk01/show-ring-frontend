'use client';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useLanding } from './landing-lang-context';

// ----------------------------------------------------------------------

export function LandingSeo() {
  const { t } = useLanding();

  return (
    <Box
      component="section"
      sx={(theme) => ({
        py: { xs: 6, md: 8 },
        bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.04),
        borderTop: `dashed 1px ${theme.vars.palette.divider}`,
      })}
    >
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Typography variant="h6" component="h2" sx={{ color: 'text.secondary' }}>
            {t.seo.title}
          </Typography>
          {t.seo.paragraphs.map((paragraph, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: 'text.disabled', lineHeight: 1.8 }}
            >
              {paragraph}
            </Typography>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
