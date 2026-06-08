'use client';

import type { BoxProps } from '@mui/material/Box';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { Image } from 'src/components/image';
import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

export function AboutVision({ sx, ...other }: BoxProps) {
  const { t } = useTranslate('about');

  const renderImage = () => (
    <Image
      src={`${CONFIG.assetsDir}/assets/images/about/vision.webp`}
      alt="About vision"
      ratio={{ xs: '4/3', sm: '16/9' }}
      slotProps={{
        overlay: {
          sx: (theme) => ({
            bgcolor: varAlpha(theme.vars.palette.grey['900Channel'], 0.48),
          }),
        },
      }}
    />
  );

  return (
    <Box
      component="section"
      sx={[
        {
          pb: 10,
          position: 'relative',
          bgcolor: 'background.neutral',
          '&::before': {
            top: 0,
            left: 0,
            width: 1,
            content: "''",
            position: 'absolute',
            height: { xs: 80, md: 120 },
            bgcolor: 'background.default',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Container component={MotionViewport}>
        <Box
          sx={{
            mb: 10,
            borderRadius: 2,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderImage()}
        </Box>

        <Typography
          component={m.h6}
          variants={varFade('inUp')}
          variant="h3"
          sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}
        >
          {t('vision.text')}
        </Typography>
      </Container>
    </Box>
  );
}
