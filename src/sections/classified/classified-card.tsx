'use client';

import type { CardProps } from '@mui/material/Card';
import type { IClassifiedItem } from 'src/types/classified';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/global-config';
import { fileUrl } from 'src/actions/file';

import { Label } from 'src/components/label';
import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';

import {
  primaryImageFileId,
  formatClassifiedPrice,
  classifiedCategoryI18nKey,
} from './classified-utils';

// ----------------------------------------------------------------------

const PLACEHOLDER = `${CONFIG.assetsDir}/assets/images/mock/cover/cover-9.webp`;

type Props = CardProps & { classified: IClassifiedItem };

export function ClassifiedCard({ classified, sx, ...other }: Props) {
  const { t } = useTranslate(['classified', 'common']);
  const detailsHref = paths.showcase.classified(classified.id);
  const imageId = primaryImageFileId(classified.images);

  const priceRaw = formatClassifiedPrice(classified.price, classified.price_kind);
  const priceDisplay =
    classified.price_kind === 'free' || classified.price_kind === 'negotiable'
      ? t(priceRaw)
      : priceRaw;

  return (
    <Card sx={sx} {...other}>
      <Box sx={{ p: 1, position: 'relative' }}>
        <Label
          color="info"
          sx={{ position: 'absolute', top: 16, right: 16, zIndex: 9 }}
        >
          {t(classifiedCategoryI18nKey(classified.category))}
        </Label>
        <Image
          alt={classified.title}
          src={imageId ? fileUrl(imageId) : PLACEHOLDER}
          ratio="4/3"
          sx={{ borderRadius: 1.5 }}
        />
      </Box>

      <ListItemText
        sx={{ p: (theme) => theme.spacing(1, 2.5, 0, 2.5) }}
        primary={
          <Link component={RouterLink} href={detailsHref} color="inherit">
            {classified.title}
          </Link>
        }
        secondary={priceDisplay}
        slotProps={{
          primary: { noWrap: true, sx: { typography: 'subtitle1' } },
          secondary: { sx: { mt: 0.5, typography: 'subtitle2', color: 'primary.main' } },
        }}
      />

      <Box
        sx={{
          p: 2.5,
          gap: 0.5,
          display: 'flex',
          alignItems: 'center',
          typography: 'body2',
          color: 'text.secondary',
        }}
      >
        <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />
        {classified.city ?? '—'}
      </Box>
    </Card>
  );
}
