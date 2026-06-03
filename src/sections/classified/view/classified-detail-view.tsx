'use client';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { fileUrl } from 'src/actions/file';
import { useGetBreeds } from 'src/actions/reference';
import { useGetClassified } from 'src/actions/classified';

import { Label } from 'src/components/label';
import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';
import { LoadingScreen } from 'src/components/loading-screen';
import { Lightbox, useLightbox } from 'src/components/lightbox';

import { formatClassifiedPrice } from '../classified-utils';

// ----------------------------------------------------------------------

const CATEGORY_LABEL: Record<string, string> = {
  puppy_sale: 'Щенки',
  adult_sale: 'Взрослые',
  mating: 'Вязка',
  handler: 'Хендлер',
  grooming: 'Груминг',
  other: 'Другое',
};

type Props = { id: string };

export function ClassifiedDetailView({ id }: Props) {
  const { classified, classifiedLoading } = useGetClassified(id);
  const { breeds } = useGetBreeds();

  const slides = (classified?.images ?? []).map((img) => ({ src: fileUrl(img.file_id) }));
  const lightbox = useLightbox(slides);

  if (classifiedLoading) return <LoadingScreen />;
  if (!classified) {
    return (
      <Container sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Typography>Объявление не найдено.</Typography>
      </Container>
    );
  }

  const breedName = breeds.find((b) => b.id === classified.breed_id)?.name;

  return (
    <Container sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      {slides.length > 0 && (
        <>
          <Box
            sx={{
              gap: 1,
              display: 'grid',
              mb: { xs: 3, md: 5 },
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
            }}
          >
            {slides.slice(0, 4).map((slide) => (
              <Image
                key={slide.src}
                alt={classified.title}
                src={slide.src}
                ratio="1/1"
                onClick={() => lightbox.onOpen(slide.src)}
                sx={{ borderRadius: 2, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
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
      )}

      <Box sx={{ mx: 'auto', maxWidth: 720 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {classified.title}
          </Typography>
          <Label color="info">{CATEGORY_LABEL[classified.category] ?? classified.category}</Label>
        </Stack>

        <Typography variant="h5" sx={{ color: 'primary.main', mb: 2 }}>
          {formatClassifiedPrice(classified.price, classified.price_kind)}
        </Typography>

        <Stack direction="row" flexWrap="wrap" spacing={3} sx={{ typography: 'body2' }}>
          {breedName && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Iconify icon="solar:bone-bold-duotone" sx={{ color: 'info.main' }} />
              {breedName}
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />
            {classified.city ?? '—'}
          </Box>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed', my: 4 }} />

        <Markdown children={classified.description} />

        {(classified.contact_phone || classified.contact_email) && (
          <>
            <Divider sx={{ borderStyle: 'dashed', my: 4 }} />
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Контакты
            </Typography>
            <Stack spacing={1}>
              {classified.contact_phone && (
                <Link href={`tel:${classified.contact_phone}`}>{classified.contact_phone}</Link>
              )}
              {classified.contact_email && (
                <Link href={`mailto:${classified.contact_email}`}>
                  {classified.contact_email}
                </Link>
              )}
            </Stack>
          </>
        )}
      </Box>
    </Container>
  );
}
