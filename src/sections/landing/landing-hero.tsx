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

import { allLangs } from 'src/locales';
import { CONFIG } from 'src/global-config';
import { LanguagePopover } from 'src/layouts/components/language-popover';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

import { useLanding } from './landing-lang-context';

// ----------------------------------------------------------------------

const asset = (name: string) => `${CONFIG.assetsDir}/assets/landing/${name}`;

const FloatDecor = ({ src, sx }: { src: string; sx?: object }) => (
  <Box
    component={m.img}
    src={src}
    alt=""
    aria-hidden
    initial={{ y: 0 }}
    animate={{ y: [0, -14, 0] }}
    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    sx={[{ position: 'absolute', pointerEvents: 'none' }, ...(Array.isArray(sx) ? sx : [sx])]}
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
      {/* Decorative background */}
      <Box
        component="img"
        src={asset('blob.svg')}
        alt=""
        aria-hidden
        sx={{ position: 'absolute', top: -80, right: -120, width: 520, opacity: 0.9 }}
      />
      <FloatDecor src={asset('ring.svg')} sx={{ top: 80, left: '6%', width: 84, opacity: 0.5, display: { xs: 'none', md: 'block' } }} />
      <FloatDecor src={asset('rosette.svg')} sx={{ bottom: 60, left: '12%', width: 72, opacity: 0.7, display: { xs: 'none', md: 'block' } }} />
      <FloatDecor src={asset('paw.svg')} sx={{ top: 120, right: '10%', width: 64, opacity: 0.35, display: { xs: 'none', md: 'block' } }} />

      <LanguagePopover data={allLangs} sx={{ position: 'absolute', top: 24, right: 24, zIndex: 9 }} />

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
