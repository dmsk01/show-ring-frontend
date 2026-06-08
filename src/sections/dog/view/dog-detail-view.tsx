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

import { useTranslate } from 'src/locales';
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
  const { t } = useTranslate(['dog', 'common']);
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
  if (!dog) return <DashboardContent>{t('detail.notFound')}</DashboardContent>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={dog.name}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: t('list.title'), href: paths.dashboard.dogs.root },
          { name: dog.name },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.dogs.edit(dog.id)}
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            {t('detail.edit')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={tab} onChange={(_e: React.SyntheticEvent, v: string) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="info" label={t('detail.info')} />
        <Tab value="titles" label={`${t('detail.titles')} (${titles.length})`} />
        <Tab value="pedigree" label={t('detail.pedigree')} />
      </Tabs>

      {tab === 'info' && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            {slides.length > 0 ? (
              <>
                <Box
                  sx={{
                    gap: 1,
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(1, 1fr)',
                      md: slides.length > 1 ? 'repeat(2, 1fr)' : 'repeat(1, 1fr)',
                    },
                  }}
                >
                  <Image
                    alt={dog.name}
                    src={slides[0].src}
                    ratio="1/1"
                    onClick={() => lightbox.onOpen(slides[0].src)}
                    sx={[
                      (theme) => ({
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: theme.transitions.create('opacity'),
                        '&:hover': { opacity: 0.8 },
                      }),
                    ]}
                  />

                  {slides.length > 1 && (
                    <Box sx={{ gap: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                      {slides.slice(1, 5).map((slide) => (
                        <Image
                          key={slide.src}
                          alt={dog.name}
                          src={slide.src}
                          ratio="1/1"
                          onClick={() => lightbox.onOpen(slide.src)}
                          sx={[
                            (theme) => ({
                              borderRadius: 2,
                              cursor: 'pointer',
                              transition: theme.transitions.create('opacity'),
                              '&:hover': { opacity: 0.8 },
                            }),
                          ]}
                        />
                      ))}
                    </Box>
                  )}
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
                ratio="16/9"
                sx={{ borderRadius: 2 }}
              />
            )}

            <Stack spacing={1.5}>
              <Typography variant="body2">{t('detail.breed')}: {breedName ?? '—'}</Typography>
              <Typography variant="body2">{t('detail.sex')}: {dog.sex === 'female' ? t('enums.sex.female') : t('enums.sex.male')}</Typography>
              <Typography variant="body2">{t('detail.rkfNumber')}: {dog.rkf_number ?? '—'}</Typography>
              <Typography variant="body2">{t('detail.born')}: {dog.date_of_birth ?? '—'}</Typography>
              <Typography variant="body2">{t('detail.color')}: {dog.color ?? '—'}</Typography>
              <Typography variant="body2">{t('detail.microchip')}: {dog.microchip ?? '—'}</Typography>
              <Typography variant="body2">{t('detail.description')}: {dog.description ?? '—'}</Typography>
            </Stack>
          </Stack>
        </Card>
      )}

      {tab === 'titles' && (
        <Card sx={{ p: 3 }}>
          {titles.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('detail.noTitles')}
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {titles.map((title) => (
                <Typography key={title.id} variant="body2">
                  {title.title_id} — {t('detail.earned')} {title.date_earned}
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
              {t('detail.noPedigree')}
            </Typography>
          )}
        </Card>
      )}
    </DashboardContent>
  );
}
