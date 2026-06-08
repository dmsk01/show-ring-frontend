'use client';

import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { _socials } from 'src/_mock';
import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type InfoItem = { label: string; value: string; href: string };

const ITEM_ICONS = [
  'solar:letter-bold',
  'solar:headphones-round-bold',
  'solar:phone-bold',
  'solar:clock-circle-bold',
] as const;

export function ContactInfo({ sx, ...other }: BoxProps) {
  const { t } = useTranslate('contact');

  const items = t('info.items', { returnObjects: true }) as InfoItem[];

  return (
    <Box sx={sx} {...other}>
      <Typography variant="h3">{t('info.title')}</Typography>

      <Typography sx={{ mt: 2, mb: 5, color: 'text.secondary' }}>{t('info.subtitle')}</Typography>

      <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
        {items.map((item, index) => (
          <Box key={item.label} sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Iconify
              icon={ITEM_ICONS[index] ?? 'solar:letter-bold'}
              width={28}
              sx={{ flexShrink: 0, color: 'primary.main' }}
            />

            <ListItemText
              primary={item.label}
              secondary={
                item.href ? (
                  <Link href={item.href} color="inherit" sx={{ typography: 'subtitle2' }}>
                    {item.value}
                  </Link>
                ) : (
                  item.value
                )
              }
              slotProps={{
                primary: { sx: { typography: 'caption', color: 'text.disabled' } },
                secondary: { sx: { typography: 'subtitle2', color: 'text.primary' } },
              }}
            />
          </Box>
        ))}
      </Box>

      <Typography variant="overline" sx={{ mt: 5, mb: 1, display: 'block', color: 'text.disabled' }}>
        {t('info.socialsTitle')}
      </Typography>

      <Box sx={{ display: 'flex' }}>
        {_socials.map((social) => (
          <IconButton key={social.label}>
            {social.value === 'twitter' && <Iconify icon="socials:twitter" />}
            {social.value === 'facebook' && <Iconify icon="socials:facebook" />}
            {social.value === 'instagram' && <Iconify icon="socials:instagram" />}
            {social.value === 'linkedin' && <Iconify icon="socials:linkedin" />}
          </IconButton>
        ))}
      </Box>
    </Box>
  );
}
