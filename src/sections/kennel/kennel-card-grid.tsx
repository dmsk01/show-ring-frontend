import type { IKennelItem } from 'src/types/kennel';

import Box from '@mui/material/Box';

import { KennelCard } from './kennel-card';

// ----------------------------------------------------------------------

type Props = { kennels: IKennelItem[] };

export function KennelCardGrid({ kennels }: Props) {
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
      {kennels.map((kennel) => (
        <KennelCard key={kennel.id} kennel={kennel} />
      ))}
    </Box>
  );
}
