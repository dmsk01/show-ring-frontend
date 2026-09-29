import { Box, Tooltip, Iconify, IconButton } from 'show-ring-ds';

export const Open = () => (
  <Box sx={{ pt: 6, pl: 8 }}>
    <Tooltip open title="Удалить собаку" placement="top" arrow>
      <IconButton color="error">
        <Iconify icon="solar:trash-bin-trash-bold" />
      </IconButton>
    </Tooltip>
  </Box>
);
