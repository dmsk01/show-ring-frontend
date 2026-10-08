'use client';

import type { IconifyName } from 'src/components/iconify/register-icons';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { endpoints } from 'src/lib/axios';
import { CONFIG } from 'src/global-config';
import { fileUrl } from 'src/actions/file';
import { useTranslate } from 'src/locales';
import { useGetDogs } from 'src/actions/dog';
import { useGetKennel } from 'src/actions/kennel';
import { useGetBreeds } from 'src/actions/reference';
import { useGetLittersList } from 'src/actions/litter';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { RevealContacts } from 'src/components/reveal-contacts';

import { DogCardGrid } from 'src/sections/dog/dog-card-grid';
import { ProfileCover } from 'src/sections/user/profile-cover';

import { KennelLitterCard } from '../kennel-litter-card';

// ----------------------------------------------------------------------

const KENNEL_COVER_PLACEHOLDER = `${CONFIG.assetsDir}/assets/images/mock/cover/cover-4.webp`;

type Props = { id: string };

export function KennelDetailView({ id }: Props) {
  const { t } = useTranslate(['kennel', 'common']);

  const { kennel, kennelLoading } = useGetKennel(id);
  const { litters, littersLoading } = useGetLittersList({ kennel_id: id });
  const { dogs, dogsLoading } = useGetDogs({ kennel_id: id });
  const { breeds } = useGetBreeds();

  const breedNameById = Object.fromEntries(breeds.map((b) => [b.id, b.name]));

  if (kennelLoading) return <LoadingScreen />;
  if (!kennel) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>{t('detail.notFound')}</Typography>
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
      <Card sx={{ mb: 3, height: 290, position: 'relative' }}>
        <ProfileCover
          name={kennel.name}
          role={kennel.kennel_prefix ?? ''}
          coverUrl={KENNEL_COVER_PLACEHOLDER}
          avatarUrl={avatarUrl || ''}
        />

        <Box
          sx={{
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9,
            height: 56,
            position: 'absolute',
            bgcolor: 'background.paper',
          }}
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
            // Отметка — не гарантия (п. 3.3 Пользовательского соглашения).
            <Tooltip title={t('detail.verifiedHint')}>
              <Label color="success" startIcon={<Iconify icon="solar:verified-check-bold" />}>
                {t('detail.verified')}
              </Label>
            </Tooltip>
          )}
          {contacts.length === 0 &&
            (kennel.has_public_contacts ? (
              // Открытые контакты — только по кнопке (защита от сборщиков).
              <RevealContacts url={endpoints.kennel.contacts(kennel.id)} />
            ) : (
              // Без согласия на распространение (ст. 10.1 152-ФЗ) контактов
              // нет — объясняем, а не показываем пустоту.
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('detail.contactsHidden')}
              </Typography>
            ))}
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
        {t('detail.litters')}
      </Typography>
      {littersLoading ? (
        <LoadingScreen />
      ) : litters.length === 0 ? (
        <EmptyContent filled title={t('detail.littersEmpty')} sx={{ py: 6, mb: 5 }} />
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
        {t('detail.dogs')}
      </Typography>
      {dogsLoading ? (
        <LoadingScreen />
      ) : dogs.length === 0 ? (
        <EmptyContent filled title={t('detail.dogsEmpty')} sx={{ py: 6 }} />
      ) : (
        <DogCardGrid dogs={dogs} breedNameById={breedNameById} />
      )}
    </Container>
  );
}
