'use client';

import type { CardProps } from '@mui/material/Card';
import type { IDogItem } from 'src/types/dog';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { fileUrl } from 'src/actions/file';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { CardLink, cardActionableSx } from 'src/components/card-link';

import { dogPlaceholderImage } from './dog-utils';

// ----------------------------------------------------------------------

type Props = CardProps & {
  dog: IDogItem;
  breedName?: string;
};

export function DogCard({ dog, breedName, sx, ...other }: Props) {
  const { t } = useTranslate(['dog', 'common']);
  const detailsHref = paths.showcase.dog(dog.id);

  const info = [
    {
      icon: <Iconify icon="solar:bone-bold-duotone" sx={{ color: 'info.main' }} />,
      label: breedName ?? '—',
    },
    {
      icon: (
        <Iconify
          icon={dog.sex === 'female' ? 'solar:women-bold' : 'solar:men-bold'}
          sx={{ color: 'primary.main' }}
        />
      ),
      label: dog.sex === 'female' ? t('enums.sex.female') : t('enums.sex.male'),
    },
    {
      icon: <Iconify icon="solar:calendar-date-bold" sx={{ color: 'warning.main' }} />,
      label: dog.date_of_birth ? fDate(dog.date_of_birth) : '—',
    },
  ];

  return (
    <Card sx={[cardActionableSx, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      <Box sx={{ p: 1 }}>
        <Image
          alt={dog.name}
          src={fileUrl(dog.avatar_file_id) || dogPlaceholderImage(dog.sex)}
          ratio="4/3"
          sx={{ borderRadius: 1.5 }}
        />
      </Box>

      <ListItemText
        sx={{ p: (theme) => theme.spacing(1, 2.5, 0, 2.5) }}
        primary={<CardLink href={detailsHref}>{dog.name}</CardLink>}
        secondary={dog.rkf_number ? `${t('detail.rkfNumber')}: ${dog.rkf_number}` : ' '}
        slotProps={{
          primary: { noWrap: true, sx: { typography: 'subtitle1' } },
          secondary: { sx: { mt: 0.5, typography: 'caption', color: 'text.disabled' } },
        }}
      />

      <Box
        sx={{
          p: 2.5,
          gap: 1,
          display: 'flex',
          flexWrap: 'wrap',
          typography: 'body2',
        }}
      >
        {info.map((item) => (
          <Box
            key={item.label}
            sx={{ gap: 0.5, display: 'flex', alignItems: 'center', mr: 1.5 }}
          >
            {item.icon}
            {item.label}
          </Box>
        ))}
      </Box>
    </Card>
  );
}
