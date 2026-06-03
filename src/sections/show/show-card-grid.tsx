import type { IShowItem } from 'src/types/show';

import Box from '@mui/material/Box';

import { ShowCard } from './show-card';

// ----------------------------------------------------------------------

type Props = { shows: IShowItem[] };

export function ShowCardGrid({ shows }: Props) {
  return (
    <Box
      sx={{
        gap: 3,
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
      }}
    >
      {shows.map((show) => (
        <ShowCard key={show.id} show={show} />
      ))}
    </Box>
  );
}
