'use client';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { varFade, MotionViewport, AnimateCountUp } from 'src/components/animate';

import { useLanding } from './landing-lang-context';
import { LandingSectionHeading } from './landing-section-heading';

// ----------------------------------------------------------------------

const VALUES = [12000, 3500, 250000, 9800];

export function LandingStats() {
  const { t } = useLanding();

  return (
    <Box
      component="section"
      sx={(theme) => ({
        py: { xs: 8, md: 12 },
        bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
      })}
    >
      <Container component={MotionViewport}>
        <LandingSectionHeading
          caption={t.stats.caption}
          title={t.stats.title}
          sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto' }}
        />

        <Box
          sx={{
            gap: { xs: 4, md: 3 },
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          }}
        >
          {t.stats.items.map((item, index) => (
            <Box
              key={index}
              component={m.div}
              variants={varFade('inUp', { distance: 24 })}
              sx={{ textAlign: 'center' }}
            >
              <AnimateCountUp
                to={VALUES[index]}
                toFixed={1}
                sx={{
                  color: 'primary.main',
                  fontWeight: 800,
                  fontSize: { xs: 36, md: 56 },
                  lineHeight: 1.1,
                }}
              />
              <Typography sx={{ mt: 1, color: 'text.secondary', fontWeight: 500 }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
