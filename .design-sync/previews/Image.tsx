import { Box, Stack, Image } from 'show-ring-ds';

// Inline placeholder photo so the card has no network dependency.
const PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C8FAD6"/><stop offset="1" stop-color="#007867"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="400" cy="300" r="120" fill="#ffffff" fill-opacity=".35"/></svg>'
  );

export const Ratios = () => (
  <Stack direction="row" spacing={2} alignItems="flex-start">
    <Box sx={{ width: 240 }}>
      <Image alt="Самоед" src={PHOTO} ratio="4/3" visibleByDefault sx={{ borderRadius: 1.5 }} />
    </Box>
    <Box sx={{ width: 160 }}>
      <Image alt="Самоед" src={PHOTO} ratio="1/1" visibleByDefault sx={{ borderRadius: 1.5 }} />
    </Box>
    <Box sx={{ width: 120 }}>
      <Image alt="Самоед" src={PHOTO} ratio="3/4" visibleByDefault sx={{ borderRadius: 1.5 }} />
    </Box>
  </Stack>
);
