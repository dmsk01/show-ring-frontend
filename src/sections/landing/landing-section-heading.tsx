import type { BoxProps } from '@mui/material/Box';

import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { varFade } from 'src/components/animate';

// ----------------------------------------------------------------------

type Props = BoxProps & {
  caption: string;
  title: string;
};

export function LandingSectionHeading({ caption, title, sx, ...other }: Props) {
  return (
    <Box sx={[{ mb: { xs: 5, md: 8 } }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      <m.div variants={varFade('inUp', { distance: 24 })}>
        <Typography
          variant="overline"
          sx={{ display: 'block', color: 'primary.main', mb: 1.5, letterSpacing: 1 }}
        >
          {caption}
        </Typography>
      </m.div>

      <m.div variants={varFade('inUp', { distance: 24 })}>
        <Typography variant="h2" sx={{ fontSize: { xs: 28, md: 40 } }}>
          {title}
        </Typography>
      </m.div>
    </Box>
  );
}
