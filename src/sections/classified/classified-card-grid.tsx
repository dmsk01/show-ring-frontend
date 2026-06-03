import type { IClassifiedItem } from 'src/types/classified';

import Box from '@mui/material/Box';

import { ClassifiedCard } from './classified-card';

// ----------------------------------------------------------------------

type Props = { classifieds: IClassifiedItem[] };

export function ClassifiedCardGrid({ classifieds }: Props) {
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
      {classifieds.map((item) => (
        <ClassifiedCard key={item.id} classified={item} />
      ))}
    </Box>
  );
}
