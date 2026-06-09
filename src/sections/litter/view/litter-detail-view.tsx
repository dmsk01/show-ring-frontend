'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';
import { useGetBreeds } from 'src/actions/reference';
import { useGetLitter, useGetLitterPuppies } from 'src/actions/litter';

import { Label } from 'src/components/label';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { DogCardGrid } from 'src/sections/dog/dog-card-grid';

// ----------------------------------------------------------------------

type Props = { id: string };

export function LitterDetailView({ id }: Props) {
  const { t } = useTranslate(['litter', 'kennel', 'common']);

  const { litter, litterLoading } = useGetLitter(id);
  const { puppies, puppiesLoading } = useGetLitterPuppies(id);
  const { breeds } = useGetBreeds();

  const breedNameById = Object.fromEntries(breeds.map((b) => [b.id, b.name]));

  if (litterLoading) return <LoadingScreen />;
  if (!litter) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>{t('page.notFound')}</Typography>
      </Container>
    );
  }

  const breedName = breedNameById[litter.breed_id];

  const price =
    litter.price_from != null || litter.price_to != null
      ? [litter.price_from, litter.price_to]
          .filter((v) => v != null)
          .map((v) => fCurrency(v as number))
          .join(' – ')
      : '—';

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Card sx={{ p: 3, mb: 5 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="h5">{breedName ?? t('kennel:detail.litter.fallback')}</Typography>
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
          <Box>
            {t('kennel:detail.litter.born')}: {litter.born_at ? fDate(litter.born_at) : '—'}
          </Box>
          <Box>
            {t('kennel:detail.litter.puppies')}: {litter.puppies_count ?? '—'} (♂
            {litter.males_count ?? '—'} / ♀{litter.females_count ?? '—'})
          </Box>
          <Box>
            {t('kennel:detail.litter.price')}: {price}
          </Box>
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
          <Typography variant="body2" sx={{ mt: 2 }}>
            {litter.description}
          </Typography>
        )}
      </Card>

      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('page.puppies')}
      </Typography>
      {puppiesLoading ? (
        <LoadingScreen />
      ) : puppies.length === 0 ? (
        <EmptyContent filled title={t('page.puppiesEmpty')} sx={{ py: 6 }} />
      ) : (
        <DogCardGrid dogs={puppies} breedNameById={breedNameById} />
      )}
    </Container>
  );
}
