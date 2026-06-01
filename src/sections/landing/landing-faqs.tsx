'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Accordion, { accordionClasses } from '@mui/material/Accordion';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

import { useLanding } from './landing-lang-context';

// ----------------------------------------------------------------------

export function LandingFAQs() {
  const { t } = useLanding();
  const [expanded, setExpanded] = useState<string | false>(t.faqs.items[0]?.q ?? false);

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        py: { xs: 10, md: 14 },
        backgroundImage: `url(${CONFIG.assetsDir}/assets/background/background-6.webp)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for readability */}
      <Box
        sx={(theme) => ({
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom, ${varAlpha(theme.vars.palette.common.blackChannel, 0.82)}, ${varAlpha(theme.vars.palette.common.blackChannel, 0.92)})`,
        })}
      />

      <Container component={MotionViewport} maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
        <Stack sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
          <m.div variants={varFade('inUp', { distance: 24 })}>
            <Typography variant="overline" sx={{ color: 'primary.light', letterSpacing: 1 }}>
              {t.faqs.caption}
            </Typography>
          </m.div>
          <m.div variants={varFade('inUp', { distance: 24 })}>
            <Typography variant="h2" sx={{ color: 'common.white', fontSize: { xs: 28, md: 40 } }}>
              {t.faqs.title}
            </Typography>
          </m.div>
        </Stack>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {t.faqs.items.map((item) => (
            <Accordion
              key={item.q}
              disableGutters
              component={m.div}
              variants={varFade('inUp', { distance: 24 })}
              expanded={expanded === item.q}
              onChange={handleChange(item.q)}
              sx={{
                px: 2.5,
                py: 1,
                border: 'none',
                borderRadius: 2,
                color: 'common.white',
                bgcolor: varAlpha('255 255 255', 0.08),
                backdropFilter: 'blur(6px)',
                '&:hover': { bgcolor: varAlpha('255 255 255', 0.12) },
                [`&.${accordionClasses.expanded}`]: { bgcolor: varAlpha('255 255 255', 0.14) },
                '&::before': { display: 'none' },
              }}
            >
              <AccordionSummary
                expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" sx={{ color: 'common.white' }} />}
              >
                <Typography component="span" variant="h6">
                  {item.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: varAlpha('255 255 255', 0.72) }}>{item.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Stack sx={{ mt: { xs: 6, md: 8 }, alignItems: 'center', textAlign: 'center' }}>
          <m.div variants={varFade('inUp')}>
            <Typography variant="h4" sx={{ color: 'common.white' }}>
              {t.faqs.contactTitle}
            </Typography>
          </m.div>
          <m.div variants={varFade('inUp')}>
            <Typography sx={{ mt: 1, mb: 3, color: varAlpha('255 255 255', 0.72) }}>
              {t.faqs.contactText}
            </Typography>
          </m.div>
          <m.div variants={varFade('inUp')}>
            <Button
              size="large"
              variant="contained"
              color="primary"
              href="mailto:support@showring.app"
              startIcon={<Iconify icon="solar:letter-bold" />}
            >
              {t.faqs.contactCta}
            </Button>
          </m.div>
        </Stack>
      </Container>
    </Box>
  );
}
