'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';

import { MotionViewport } from 'src/components/animate';
import {
  Carousel,
  useCarousel,
  CarouselDotButtons,
  CarouselArrowBasicButtons,
} from 'src/components/carousel';

import { useLanding } from './landing-lang-context';
import { LandingSectionHeading } from './landing-section-heading';

// ----------------------------------------------------------------------

const COVERS = [
  `${CONFIG.assetsDir}/assets/background/background-3.webp`,
  `${CONFIG.assetsDir}/assets/background/background-5.webp`,
  `${CONFIG.assetsDir}/assets/background/background-6.webp`,
];

export function LandingNews() {
  const { t } = useLanding();

  const carousel = useCarousel({ slideSpacing: '24px', slidesToShow: { xs: 1, sm: 2, md: 3 } });

  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
      <Container component={MotionViewport}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <LandingSectionHeading caption={t.news.caption} title={t.news.title} sx={{ mb: 0 }} />
          <CarouselArrowBasicButtons
            {...carousel.arrows}
            options={carousel.options}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          />
        </Box>

        <Box sx={{ mt: { xs: 4, md: 6 } }}>
          <Carousel carousel={carousel}>
            {t.news.items.map((item, index) => (
              <Card key={index} sx={{ height: 1 }}>
                <Box
                  component="img"
                  alt={item.title}
                  src={COVERS[index % COVERS.length]}
                  sx={{ height: 200, width: 1, objectFit: 'cover' }}
                />
                <Stack spacing={1.5} sx={{ p: 3 }}>
                  <Chip label={item.date} size="small" color="primary" variant="soft" sx={{ alignSelf: 'flex-start' }} />
                  <Typography variant="h6">{item.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {item.excerpt}
                  </Typography>
                </Stack>
              </Card>
            ))}
          </Carousel>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CarouselDotButtons
            scrollSnaps={carousel.dots.scrollSnaps}
            selectedIndex={carousel.dots.selectedIndex}
            onClickDot={carousel.dots.onClickDot}
          />
        </Box>
      </Container>
    </Box>
  );
}
