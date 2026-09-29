import { Chip, Stack, Avatar, Iconify } from 'show-ring-ds';

export const Filters = () => (
  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
    <Chip label="Самоед" onDelete={() => {}} />
    <Chip label="Москва" variant="outlined" onDelete={() => {}} />
    <Chip label="CAC" color="primary" size="small" />
    <Chip label="Юниоры" variant="soft" color="info" />
  </Stack>
);

export const WithMedia = () => (
  <Stack direction="row" spacing={1}>
    <Chip avatar={<Avatar>А</Avatar>} label="Анна Смирнова" variant="outlined" />
    <Chip icon={<Iconify icon="solar:calendar-date-bold" />} label="12 октября" />
  </Stack>
);

export const Colors = () => (
  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
    {(['default', 'primary', 'secondary', 'info', 'success', 'warning', 'error'] as const).map((c) => (
      <Chip key={c} label={c} color={c} />
    ))}
  </Stack>
);
