import { Stack, Iconify, Typography } from 'show-ring-ds';

// Icons registered offline in src/components/iconify/icon-sets.ts - prefer these.
const ICONS = [
  'solar:calendar-date-bold',
  'mingcute:location-fill',
  'solar:bone-bold-duotone',
  'solar:men-bold',
  'solar:women-bold',
  'solar:verified-check-bold',
  'solar:users-group-rounded-bold',
  'solar:wad-of-money-bold',
  'solar:pen-bold',
  'solar:trash-bin-trash-bold',
  'mingcute:add-line',
  'eva:more-vertical-fill',
] as const;

export const Registered = () => (
  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ maxWidth: 560 }}>
    {ICONS.map((icon) => (
      <Stack key={icon} alignItems="center" spacing={0.5} sx={{ width: 160 }}>
        <Iconify icon={icon} width={24} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {icon}
        </Typography>
      </Stack>
    ))}
  </Stack>
);

export const Colored = () => (
  <Stack direction="row" spacing={2}>
    <Iconify icon="solar:verified-check-bold" width={32} sx={{ color: 'success.main' }} />
    <Iconify icon="solar:heart-bold" width={32} sx={{ color: 'error.main' }} />
    <Iconify icon="solar:bone-bold-duotone" width={32} sx={{ color: 'primary.main' }} />
  </Stack>
);
