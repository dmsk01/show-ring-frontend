'use client';

import type { BoxProps } from '@mui/material/Box';
import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { LEGAL_OPERATOR } from 'src/sections/legal/operator';

// ----------------------------------------------------------------------
// Контакты — из единого источника реквизитов (src/sections/legal/operator.ts),
// а не из демо-текста шаблона: раньше здесь были вымышленные адреса,
// телефон +7 (495) 000-00-00 и чужие соцсети. Незаполненное не показываем.

type Item = { label: string; value: string; href?: string; icon: IconifyName };

export function ContactInfo({ sx, ...other }: BoxProps) {
  const { t } = useTranslate('contact');
  const o = LEGAL_OPERATOR;

  const items = [
    o.supportEmail && {
      label: t('info.support'),
      value: o.supportEmail,
      href: `mailto:${o.supportEmail}`,
      icon: 'solar:chat-round-dots-bold',
    },
    o.privacyEmail && {
      label: t('info.privacy'),
      value: o.privacyEmail,
      href: `mailto:${o.privacyEmail}`,
      icon: 'solar:letter-bold',
    },
    o.address && { label: t('info.address'), value: o.address, icon: 'mingcute:location-fill' },
  ].filter(Boolean) as Item[];

  return (
    <Box sx={sx} {...other}>
      <Typography variant="h3">{t('info.title')}</Typography>

      <Typography sx={{ mt: 2, mb: 5, color: 'text.secondary' }}>{t('info.subtitle')}</Typography>

      <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
        {items.map((item) => (
          <Box key={item.label} sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Iconify icon={item.icon} width={28} sx={{ flexShrink: 0, color: 'primary.main' }} />
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
    </Box>
  );
}
