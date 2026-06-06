'use client';

import type { CardProps } from '@mui/material/Card';
import type { IKennelItem } from 'src/types/kennel';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';
import { fileUrl } from 'src/actions/file';
import { useTranslate } from 'src/locales';

import { Image } from 'src/components/image';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const KENNEL_PLACEHOLDER = `${CONFIG.assetsDir}/assets/images/mock/cover/cover-4.webp`;

type Props = CardProps & {
  kennel: IKennelItem;
};

export function KennelCard({ kennel, sx, ...other }: Props) {
  const { t } = useTranslate(['kennel', 'common']);
  const detailsHref = paths.showcase.kennel(kennel.id);
  const location = [kennel.city, kennel.country].filter(Boolean).join(', ') || '—';

  return (
    <Card sx={sx} {...other}>
      <Box sx={{ p: 1, position: 'relative' }}>
        {kennel.is_verified && (
          <Label
            color="success"
            startIcon={<Iconify icon="solar:verified-check-bold" />}
            sx={{ position: 'absolute', top: 16, right: 16, zIndex: 9 }}
          >
            {t('card.verified')}
          </Label>
        )}
        <Image
          alt={kennel.name}
          src={fileUrl(kennel.avatar_file_id) || KENNEL_PLACEHOLDER}
          ratio="4/3"
          sx={{ borderRadius: 1.5 }}
        />
      </Box>

      <ListItemText
        sx={{ p: (theme) => theme.spacing(1, 2.5, 0, 2.5) }}
        primary={
          <Link component={RouterLink} href={detailsHref} color="inherit">
            {kennel.name}
          </Link>
        }
        secondary={
          kennel.kennel_prefix ? `${t('card.prefix')}: ${kennel.kennel_prefix}` : ' '
        }
        slotProps={{
          primary: { noWrap: true, sx: { typography: 'subtitle1' } },
          secondary: { sx: { mt: 0.5, typography: 'caption', color: 'text.disabled' } },
        }}
      />

      <Box sx={{ p: 2.5, pt: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', typography: 'body2' }}>
          <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />
          {location}
        </Box>
        <Box sx={{ typography: 'caption', color: 'text.disabled' }}>
          {t('card.stats', { dogs: kennel.dogs_count, litters: kennel.litters_count })}
        </Box>
      </Box>
    </Card>
  );
}
