'use client';

import type { ILitterItem } from 'src/types/litter';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = {
  litter: ILitterItem;
  breedName?: string;
};

export function KennelLitterCard({ litter, breedName }: Props) {
  const { t } = useTranslate(['kennel', 'common']);

  const price =
    litter.price_from != null || litter.price_to != null
      ? [litter.price_from, litter.price_to]
          .filter((v) => v != null)
          .map((v) => fCurrency(v as number))
          .join(' – ')
      : '—';

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1">{breedName ?? t('detail.litter.fallback')}</Typography>
        <Label color="info">
          {t(`common:enums.litterStatus.${litter.status}`, { defaultValue: litter.status })}
        </Label>
      </Stack>

      <Box
        sx={{
          gap: 1.5,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          typography: 'body2',
          color: 'text.secondary',
        }}
      >
        <Box>{t('detail.litter.born')}: {litter.born_at ? fDate(litter.born_at) : '—'}</Box>
        <Box>
          {t('detail.litter.puppies')}: {litter.puppies_count ?? '—'} (♂{litter.males_count ?? '—'} / ♀
          {litter.females_count ?? '—'})
        </Box>
        <Box>{t('detail.litter.price')}: {price}</Box>
        <Stack direction="row" spacing={1.5}>
          {litter.father && (
            <Link component={RouterLink} href={paths.showcase.dog(litter.father.id)}>
              ♂ {litter.father.name}
            </Link>
          )}
          {litter.mother && (
            <Link component={RouterLink} href={paths.showcase.dog(litter.mother.id)}>
              ♀ {litter.mother.name}
            </Link>
          )}
        </Stack>
      </Box>

      {litter.description && (
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          {litter.description}
        </Typography>
      )}
    </Card>
  );
}
