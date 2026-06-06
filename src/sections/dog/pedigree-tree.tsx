'use client';

import type { IPedigreeNode } from 'src/types/dog';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export function PedigreeTree({ node, label }: { node: IPedigreeNode | null; label?: string }) {
  const { t } = useTranslate(['dog', 'common']);

  if (!node) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
        {label}: —
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="body2">
        {label ? `${label}: ` : ''}
        <strong>{node.name}</strong>
        {node.rkf_number ? ` · ${node.rkf_number}` : ''}
      </Typography>

      {(node.father || node.mother) && (
        <Stack
          spacing={0.75}
          sx={{
            mt: 0.75,
            ml: 1.5,
            pl: 1.5,
            borderLeft: (theme) => `2px solid ${theme.vars.palette.divider}`,
          }}
        >
          <PedigreeTree node={node.father} label={t('pedigree.sire')} />
          <PedigreeTree node={node.mother} label={t('pedigree.dam')} />
        </Stack>
      )}
    </Box>
  );
}
