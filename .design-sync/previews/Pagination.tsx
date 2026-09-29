import { Stack, Pagination } from 'show-ring-ds';

export const Variants = () => (
  <Stack spacing={2}>
    <Pagination count={10} page={3} />
    <Pagination count={10} page={3} shape="rounded" />
    <Pagination count={10} page={3} variant="outlined" color="primary" />
    <Pagination count={10} page={3} variant="soft" color="primary" size="small" />
  </Stack>
);
