'use client';

import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

type FaqItem = { q: string; a: string };

export function FaqsList({ sx, ...other }: BoxProps) {
  const { t } = useTranslate('faqs');

  const items = t('list', { returnObjects: true }) as FaqItem[];

  return (
    <Box sx={sx} {...other}>
      {items.map((item, index) => (
        <Accordion key={item.q} disableGutters>
          <AccordionSummary
            id={`faqs-panel${index}-header`}
            aria-controls={`faqs-panel${index}-content`}
          >
            <Typography component="span" variant="subtitle1">
              {item.q}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ color: 'text.secondary' }}>{item.a}</AccordionDetails>
        </Accordion>
      ))}
      <Divider />
    </Box>
  );
}
