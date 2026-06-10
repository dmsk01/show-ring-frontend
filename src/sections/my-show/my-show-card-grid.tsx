import type { IMyShowItem } from 'src/types/show';

import Box from '@mui/material/Box';

import { MyShowCard } from './my-show-card';

// ----------------------------------------------------------------------

type Props = { shows: IMyShowItem[] };

export function MyShowCardGrid({ shows }: Props) {
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
        <MyShowCard key={show.id} show={show} />
      ))}
    </Box>
  );
}
