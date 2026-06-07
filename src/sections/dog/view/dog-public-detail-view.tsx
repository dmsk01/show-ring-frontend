'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { fileUrl } from 'src/actions/file';
import { useGetBreeds } from 'src/actions/reference';
import { useGetDog, useGetDogTitles, useGetDogPedigree } from 'src/actions/dog';

import { Image } from 'src/components/image';
import { Markdown } from 'src/components/markdown';
import { LoadingScreen } from 'src/components/loading-screen';
import { Lightbox, useLightbox } from 'src/components/lightbox';

import { PedigreeTree } from '../pedigree-tree';
import { dogPlaceholderImage } from '../dog-utils';

// ----------------------------------------------------------------------

type Props = { id: string };

export function DogPublicDetailView({ id }: Props) {
  const { t } = useTranslate(['dog', 'common']);
  const { dog, dogLoading } = useGetDog(id);
  const { titles } = useGetDogTitles(id);
  const { pedigree } = useGetDogPedigree(id);
  const { breeds } = useGetBreeds();

  // Hooks must run unconditionally — use dog?. guards for undefined on first render.
  const photoIds = [dog?.avatar_file_id, ...(dog?.photo_file_ids ?? [])].filter(
    (v, i, arr): v is string => !!v && arr.indexOf(v) === i
  );
  const slides = photoIds.map((fid) => ({ src: fileUrl(fid) }));
  const lightbox = useLightbox(slides);

  if (dogLoading) return <LoadingScreen />;
  if (!dog) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>{t('detail.notFound')}</Typography>
      </Container>
    );
  }

  const breedName = breeds.find((b) => b.id === dog.breed_id)?.name ?? '—';
  const sexLabel = dog.sex === 'female' ? t('enums.sex.female') : t('enums.sex.male');

  const overview = [
    { label: t('detail.breed'), value: breedName },
    { label: t('detail.sex'), value: sexLabel },
    { label: t('detail.born'), value: dog.date_of_birth ? fDate(dog.date_of_birth) : '—' },
    { label: t('detail.color'), value: dog.color ?? '—' },
    { label: t('detail.rkfNumber'), value: dog.rkf_number ?? '—' },
    { label: t('detail.microchip'), value: dog.microchip ?? '—' },
  ];

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      {slides.length > 0 ? (
        <>
          <Box
            sx={{
              gap: 1,
              display: 'grid',
              mb: { xs: 3, md: 5 },
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
          sx={{ borderRadius: 2, mb: { xs: 3, md: 5 } }}
        />
      )}

      <Box sx={{ mx: 'auto', maxWidth: 720 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {dog.name}
          </Typography>
          <Chip size="small" label={breedName} />
          <Chip size="small" color="info" label={sexLabel} />
        </Stack>

        {dog.kennel_id && (
          <Link component={RouterLink} href={paths.showcase.kennel(dog.kennel_id)} variant="body2">
            {t('detail.kennel')}
          </Link>
        )}

        <Divider sx={{ borderStyle: 'dashed', my: 4 }} />

        <Box
          sx={{
            gap: 3,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          {overview.map((item) => (
            <ListItemText
              key={item.label}
              primary={item.label}
              secondary={item.value}
              slotProps={{
                primary: { sx: { typography: 'body2', color: 'text.secondary' } },
                secondary: { sx: { mt: 0.5, typography: 'subtitle2', color: 'text.primary' } },
              }}
            />
          ))}
        </Box>

        <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
          {dog.father_id && (
            <Link component={RouterLink} href={paths.showcase.dog(dog.father_id)} variant="body2">
              {t('detail.father')}
            </Link>
          )}
          {dog.mother_id && (
            <Link component={RouterLink} href={paths.showcase.dog(dog.mother_id)} variant="body2">
              {t('detail.mother')}
            </Link>
          )}
        </Stack>

        {dog.description && (
          <>
            <Divider sx={{ borderStyle: 'dashed', my: 4 }} />
            <Markdown>{dog.description}</Markdown>
          </>
        )}

        <Divider sx={{ borderStyle: 'dashed', my: 4 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('detail.titles')} ({titles.length})
        </Typography>
        {titles.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('detail.noTitles')}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {titles.map((title) => (
              <Typography key={title.id} variant="body2">
                {title.title_id} — {fDate(title.date_earned)}
              </Typography>
            ))}
          </Stack>
        )}

        <Divider sx={{ borderStyle: 'dashed', my: 4 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('detail.pedigree')}
        </Typography>
        <Card sx={{ p: 3 }}>
          {pedigree ? (
            <PedigreeTree node={pedigree} />
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('detail.noPedigree')}
            </Typography>
          )}
        </Card>
      </Box>
    </Container>
  );
}
