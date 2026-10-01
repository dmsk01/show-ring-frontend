import { Stack, Iconify, IconButton } from 'show-ring-ds';

export const Colors = () => (
  <Stack direction="row" spacing={1}>
    <IconButton>
      <Iconify icon="solar:pen-bold" />
    </IconButton>
    <IconButton color="primary">
      <Iconify icon="solar:heart-bold" />
    </IconButton>
    <IconButton color="info">
      <Iconify icon="solar:share-bold" />
    </IconButton>
    <IconButton color="error">
      <Iconify icon="solar:trash-bin-trash-bold" />
    </IconButton>
    <IconButton disabled>
      <Iconify icon="solar:eye-bold" />
    </IconButton>
  </Stack>
);

export const Sizes = () => (
  <Stack direction="row" spacing={1} alignItems="center">
    <IconButton size="small">
      <Iconify icon="eva:more-vertical-fill" width={18} />
    </IconButton>
    <IconButton size="medium">
      <Iconify icon="eva:more-vertical-fill" />
    </IconButton>
    <IconButton size="large">
      <Iconify icon="eva:more-vertical-fill" width={24} />
    </IconButton>
  </Stack>
);
