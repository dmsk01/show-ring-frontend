'use client';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

import { useLanding } from './landing-lang-context';

// ----------------------------------------------------------------------

const asset = (name: string) => `${CONFIG.assetsDir}/assets/landing/${name}`;

type StencilProps = { name: string; sx?: object; duration?: number; delay?: number };

const Stencil = ({ name, sx, duration = 9, delay = 0 }: StencilProps) => (
  <Box
    component={m.img}
    src={asset(`stencil/${name}.svg`)}
    alt=""
    aria-hidden
    initial={{ y: 0 }}
    animate={{ y: [0, -10, 0] }}
    transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    sx={[{ position: 'absolute', pointerEvents: 'none', opacity: 0.4 }, ...(Array.isArray(sx) ? sx : [sx])]}
  />
);

export function LandingHero() {
  const { t } = useLanding();

  return (
    <Box
      component="section"
      sx={[
        (theme) => ({
          position: 'relative',
          overflow: 'hidden',
          py: { xs: 10, md: 16 },
          background: `linear-gradient(180deg, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.1)}, transparent 60%)`,
        }),
      ]}
    >
      {/* Minimalist stencil decor — subtle, outline-only, must not pull focus */}
      <Stencil name="circle" sx={{ top: '8%', right: '-4%', width: 220, opacity: 0.18 }} duration={11} />
      <Stencil name="trophy" sx={{ top: 70, left: '7%', width: 64, display: { xs: 'none', md: 'block' } }} />
      <Stencil name="medal" sx={{ top: 130, right: '9%', width: 52, opacity: 0.5, display: { xs: 'none', sm: 'block' } }} delay={1.2} />
      <Stencil name="dog" sx={{ bottom: 56, left: '11%', width: 64, display: { xs: 'none', md: 'block' } }} delay={0.6} />
      <Stencil name="cat" sx={{ bottom: 80, right: '12%', width: 56, display: { xs: 'none', md: 'block' } }} delay={1.8} />
      <Stencil name="circle" sx={{ bottom: '-6%', left: '-3%', width: 160, opacity: 0.16 }} duration={13} delay={0.4} />

      <Container component={MotionViewport} sx={{ position: 'relative', zIndex: 2 }}>
        <Stack sx={{ maxWidth: 760, mx: 'auto', textAlign: 'center', alignItems: 'center' }}>
          <m.div variants={varFade('inDown', { distance: 24 })}>
            <Chip
              color="primary"
              variant="soft"
              label={t.hero.badge}
              icon={<Iconify icon="solar:cup-star-bold" />}
              sx={{ mb: 3, fontWeight: 600 }}
            />
          </m.div>

          <m.div variants={varFade('inUp', { distance: 24 })}>
            <Typography variant="h1" sx={{ fontSize: { xs: 36, sm: 48, md: 60 }, lineHeight: 1.1 }}>
              {t.hero.title}
            </Typography>
          </m.div>

          <m.div variants={varFade('inUp', { distance: 24 })}>
            <Typography sx={{ mt: 3, color: 'text.secondary', fontSize: { xs: 16, md: 20 }, maxWidth: 620 }}>
              {t.hero.subtitle}
            </Typography>
          </m.div>

          <m.div variants={varFade('inUp', { distance: 24 })}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 5 }}>
              <Button
                component={RouterLink}
                href={paths.auth.jwt.signUp}
                size="large"
                variant="contained"
                color="primary"
                endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
              >
                {t.hero.ctaPrimary}
              </Button>
              <Button
                component={RouterLink}
                href={paths.auth.jwt.signIn}
                size="large"
                variant="outlined"
                color="inherit"
              >
                {t.hero.ctaSecondary}
              </Button>
            </Stack>
          </m.div>

          <m.div variants={varFade('in')}>
            <Stack direction="row" spacing={{ xs: 2, sm: 3 }} sx={{ mt: 6 }}>
              {['dog', 'cat', 'trophy', 'medal'].map((icon) => (
                <Box
                  key={icon}
                  component="img"
                  src={asset(`hero/${icon}.svg`)}
                  alt=""
                  aria-hidden
                  sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 } }}
                />
              ))}
            </Stack>
          </m.div>
        </Stack>
      </Container>
    </Box>
  );
}
