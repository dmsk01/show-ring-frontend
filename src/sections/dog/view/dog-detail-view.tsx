'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fileUrl } from 'src/actions/file';
import { useGetBreeds } from 'src/actions/reference';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetDog, useGetDogTitles, useGetDogPedigree } from 'src/actions/dog';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { Lightbox, useLightbox } from 'src/components/lightbox';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PedigreeTree } from '../pedigree-tree';
import { dogPlaceholderImage } from '../dog-utils';

// ----------------------------------------------------------------------

type Props = { id: string };

export function DogDetailView({ id }: Props) {
  const [tab, setTab] = useState('info');

  const { dog, dogLoading } = useGetDog(id);
  const { titles } = useGetDogTitles(id);
  const { breeds } = useGetBreeds();
  const { pedigree } = useGetDogPedigree(id);

  const breedName = breeds.find((breed) => breed.id === dog?.breed_id)?.name;

  // Hooks must run unconditionally — guard with dog?. for the first (undefined) render.
  const photoIds = [dog?.avatar_file_id, ...(dog?.photo_file_ids ?? [])].filter(
    (v, i, arr): v is string => !!v && arr.indexOf(v) === i
  );
  const slides = photoIds.map((fid) => ({ src: fileUrl(fid) }));
  const lightbox = useLightbox(slides);

  if (dogLoading) return <LoadingScreen />;
  if (!dog) return <DashboardContent>Dog not found.</DashboardContent>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={dog.name}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Dogs', href: paths.dashboard.dogs.root },
          { name: dog.name },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.dogs.edit(dog.id)}
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            Edit
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={tab} onChange={(_e: React.SyntheticEvent, v: string) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="info" label="Info" />
        <Tab value="titles" label={`Titles (${titles.length})`} />
        <Tab value="pedigree" label="Pedigree" />
      </Tabs>

      {tab === 'info' && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            {slides.length > 0 ? (
              <>
                <Box
                  sx={{
                    gap: 1.5,
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(2, 1fr)',
                      sm: 'repeat(3, 1fr)',
                      md: 'repeat(4, 1fr)',
                    },
                  }}
                >
                  {slides.map((slide) => (
                    <Image
                      key={slide.src}
                      alt={dog.name}
                      src={slide.src}
                      ratio="1/1"
                      onClick={() => lightbox.onOpen(slide.src)}
                      sx={[
                        (theme) => ({
                          borderRadius: 1.5,
                          cursor: 'pointer',
                          transition: theme.transitions.create('opacity'),
                          '&:hover': { opacity: 0.8 },
                        }),
                      ]}
                    />
                  ))}
                </Box>

                <Lightbox
                  index={lightbox.selected}
                  slides={slides}
                  open={lightbox.open}
                  close={lightbox.onClose}
                />
              </>
            ) : (
              <Image
                alt={dog.name}
                src={dogPlaceholderImage(dog.sex)}
                ratio="1/1"
                sx={{ borderRadius: 1.5, maxWidth: 320 }}
              />
            )}

            <Stack spacing={1.5}>
              <Typography variant="body2">Breed: {breedName ?? '—'}</Typography>
              <Typography variant="body2">Sex: {dog.sex}</Typography>
              <Typography variant="body2">RKF #: {dog.rkf_number ?? '—'}</Typography>
              <Typography variant="body2">Born: {dog.date_of_birth ?? '—'}</Typography>
              <Typography variant="body2">Color: {dog.color ?? '—'}</Typography>
              <Typography variant="body2">Microchip: {dog.microchip ?? '—'}</Typography>
              <Typography variant="body2">Description: {dog.description ?? '—'}</Typography>
            </Stack>
          </Stack>
        </Card>
      )}

      {tab === 'titles' && (
        <Card sx={{ p: 3 }}>
          {titles.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No titles yet.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {titles.map((t) => (
                <Typography key={t.id} variant="body2">
                  {t.title_id} — earned {t.date_earned}
                </Typography>
              ))}
            </Stack>
          )}
        </Card>
      )}

      {tab === 'pedigree' && (
        <Card sx={{ p: 3 }}>
          {pedigree ? (
            <PedigreeTree node={pedigree} />
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No pedigree data.
            </Typography>
          )}
        </Card>
      )}
    </DashboardContent>
  );
}
