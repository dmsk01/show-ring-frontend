'use client';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

import { useLanding } from './landing-lang-context';
import { LandingSectionHeading } from './landing-section-heading';

// ----------------------------------------------------------------------

const ICONS = [
  'solar:clock-circle-bold',
  'solar:bill-list-bold',
  'solar:check-circle-bold',
  'solar:cup-star-bold',
] as const;

export function LandingAdvantages() {
  const { t } = useLanding();

  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
      <Container component={MotionViewport}>
        <LandingSectionHeading
          caption={t.advantages.caption}
          title={t.advantages.title}
          sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto' }}
        />

        <Box
          sx={{
            gap: 3,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          }}
        >
          {t.advantages.items.map((item, index) => (
            <Box key={item.title} component={m.div} variants={varFade('inUp', { distance: 24 })}>
              <Card
                sx={{
                  p: 4,
                  height: 1,
                  textAlign: 'center',
                  boxShadow: (theme) => theme.vars.customShadows.z8,
                }}
              >
                <Stack
                  sx={(theme) => ({
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 3,
                    borderRadius: '50%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary.main',
                    bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.12),
                  })}
                >
                  <Iconify icon={ICONS[index]} width={32} />
                </Stack>

                <Typography variant="h6" sx={{ mb: 1 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {item.text}
                </Typography>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
