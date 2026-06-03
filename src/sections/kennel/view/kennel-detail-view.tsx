'use client';

import type { LittersQuery } from 'src/actions/litter';
import type { IconifyName } from 'src/components/iconify/register-icons';

import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { fileUrl } from 'src/actions/file';
import { useGetDogs } from 'src/actions/dog';
import { useGetKennel } from 'src/actions/kennel';
import { useGetBreeds } from 'src/actions/reference';
import { useGetLittersList } from 'src/actions/litter';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { DogCardGrid } from 'src/sections/dog/dog-card-grid';
import { ProfileCover } from 'src/sections/user/profile-cover';

import { KennelLitterCard } from '../kennel-litter-card';

// ----------------------------------------------------------------------

type Props = { id: string };

export function KennelDetailView({ id }: Props) {
  const { kennel, kennelLoading } = useGetKennel(id);
  const { litters, littersLoading } = useGetLittersList(
    { kennel_id: id } as LittersQuery & { kennel_id?: string }
  );
  const { dogs, dogsLoading } = useGetDogs({ kennel_id: id });
  const { breeds } = useGetBreeds();

  const breedNameById = Object.fromEntries(breeds.map((b) => [b.id, b.name]));

  if (kennelLoading) return <LoadingScreen />;
  if (!kennel) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>Питомник не найден.</Typography>
      </Container>
    );
  }

  const avatarUrl = fileUrl(kennel.avatar_file_id);

  const contacts = [
    kennel.contact_phone && {
      icon: 'solar:phone-bold',
      node: <Link href={`tel:${kennel.contact_phone}`}>{kennel.contact_phone}</Link>,
    },
    kennel.contact_email && {
      icon: 'solar:letter-bold',
      node: <Link href={`mailto:${kennel.contact_email}`}>{kennel.contact_email}</Link>,
    },
    kennel.website && {
      icon: 'eva:link-2-fill',
      node: (
        <Link href={kennel.website} target="_blank" rel="noopener">
          {kennel.website}
        </Link>
      ),
    },
  ].filter(Boolean) as { icon: IconifyName; node: React.ReactNode }[];

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Card sx={{ mb: 3, height: 290 }}>
        <ProfileCover
          name={kennel.name}
          role={kennel.kennel_prefix ?? ''}
          coverUrl={avatarUrl || ''}
          avatarUrl={avatarUrl || ''}
        />
      </Card>

      <Card sx={{ p: 3, mb: 5 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />
            <Typography variant="body2">
              {[kennel.city, kennel.country].filter(Boolean).join(', ') || '—'}
            </Typography>
          </Stack>
          {kennel.is_verified && (
            <Label color="success" startIcon={<Iconify icon="solar:verified-check-bold" />}>
              Проверенный питомник
            </Label>
          )}
          {contacts.map((c) => (
            <Stack key={c.icon} direction="row" spacing={0.5} alignItems="center">
              <Iconify icon={c.icon} sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" component="span">
                {c.node}
              </Typography>
            </Stack>
          ))}
          {kennel.description && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {kennel.description}
            </Typography>
          )}
        </Stack>
      </Card>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Помёты (объявления)
      </Typography>
      {littersLoading ? (
        <LoadingScreen />
      ) : litters.length === 0 ? (
        <EmptyContent filled title="Помётов пока нет" sx={{ py: 6, mb: 5 }} />
      ) : (
        <Stack spacing={2} sx={{ mb: 5 }}>
          {litters.map((litter) => (
            <KennelLitterCard
              key={litter.id}
              litter={litter}
              breedName={breedNameById[litter.breed_id]}
            />
          ))}
        </Stack>
      )}

      <Typography variant="h5" sx={{ mb: 2 }}>
        Собаки питомника
      </Typography>
      {dogsLoading ? (
        <LoadingScreen />
      ) : dogs.length === 0 ? (
        <EmptyContent filled title="Собак пока нет" sx={{ py: 6 }} />
      ) : (
        <DogCardGrid dogs={dogs} breedNameById={breedNameById} />
      )}
    </Container>
  );
}
