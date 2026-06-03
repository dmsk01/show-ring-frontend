import type { IDogItem } from 'src/types/dog';

import Box from '@mui/material/Box';

import { DogCard } from './dog-card';

// ----------------------------------------------------------------------

type Props = {
  dogs: IDogItem[];
  breedNameById?: Record<string, string>;
};

export function DogCardGrid({ dogs, breedNameById }: Props) {
  return (
    <Box
      sx={{
        gap: 3,
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
      }}
    >
      {dogs.map((dog) => (
        <DogCard key={dog.id} dog={dog} breedName={breedNameById?.[dog.breed_id]} />
      ))}
    </Box>
  );
}
