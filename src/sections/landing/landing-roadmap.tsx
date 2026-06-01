'use client';

import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

import { useLanding } from './landing-lang-context';
import { LandingSectionHeading } from './landing-section-heading';

// ----------------------------------------------------------------------

const ICONS = ['solar:user-plus-bold', 'solar:file-text-bold', 'solar:cup-star-bold'] as const;

export function LandingRoadmap() {
  const { t } = useLanding();

  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
      <Container component={MotionViewport} maxWidth="md">
        <LandingSectionHeading
          caption={t.roadmap.caption}
          title={t.roadmap.title}
          sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto' }}
        />

        <Timeline
          sx={{
            p: 0,
            [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 },
          }}
        >
          {t.roadmap.steps.map((step, index) => (
            <TimelineItem key={index}>
              <TimelineSeparator>
                <TimelineDot color="primary" sx={{ p: 1.5 }}>
                  <Iconify icon={ICONS[index]} width={24} />
                </TimelineDot>
                {index < t.roadmap.steps.length - 1 && <TimelineConnector />}
              </TimelineSeparator>

              <TimelineContent sx={{ pb: 5, pl: 3 }}>
                <Box component={m.div} variants={varFade('inUp', { distance: 24 })}>
                  <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                    {`0${index + 1}`}
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 0.5 }}>
                    {step.title}
                  </Typography>
                  <Typography sx={{ mt: 1, color: 'text.secondary' }}>{step.text}</Typography>
                </Box>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Container>
    </Box>
  );
}
