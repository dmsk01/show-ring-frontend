'use client';

import type { CardProps } from '@mui/material/Card';
import type { IClassifiedItem } from 'src/types/classified';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/global-config';
import { fileUrl } from 'src/actions/file';

import { Label } from 'src/components/label';
import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { CardLink, cardActionableSx } from 'src/components/card-link';

import {
  primaryImageFileId,
  formatClassifiedPrice,
  classifiedCategoryI18nKey,
  classifiedPriceKindI18nKey,
} from './classified-utils';

// ----------------------------------------------------------------------

const PLACEHOLDER = `${CONFIG.assetsDir}/assets/images/mock/cover/cover-9.webp`;

type Props = CardProps & { classified: IClassifiedItem };

export function ClassifiedCard({ classified, sx, ...other }: Props) {
  const { t } = useTranslate(['classified', 'common']);
  const detailsHref = paths.showcase.classified(classified.id);
  const imageId = primaryImageFileId(classified.images);

  const priceDisplay =
    classified.price_kind === 'fixed'
      ? formatClassifiedPrice(classified.price)
      : t(classifiedPriceKindI18nKey(classified.price_kind));

  return (
    <Card sx={[cardActionableSx, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      <Box sx={{ p: 1, position: 'relative' }}>
        {classified.sex && (
          <Label
            color={classified.sex === 'female' ? 'secondary' : 'info'}
            startIcon={
              <Iconify
                icon={classified.sex === 'female' ? 'solar:women-bold' : 'solar:men-bold'}
              />
            }
            sx={{ position: 'absolute', top: 16, left: 16, zIndex: 9 }}
          >
            {t(classified.sex === 'female' ? 'enums.sex.female' : 'enums.sex.male')}
          </Label>
        )}
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
        primary={<CardLink href={detailsHref}>{classified.title}</CardLink>}
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
