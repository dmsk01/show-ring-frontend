'use client';

import type { IUserSocials } from 'src/actions/account';
import type { IconifyName } from 'src/components/iconify';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { useGetMySocials } from 'src/actions/account';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const SOCIAL_META: { name: keyof IUserSocials; icon: IconifyName; label: string }[] = [
  { name: 'instagram', icon: 'socials:instagram', label: 'Instagram' },
  { name: 'facebook', icon: 'socials:facebook', label: 'Facebook' },
  { name: 'vk', icon: 'socials:vk', label: 'VK' },
  { name: 'telegram', icon: 'socials:telegram', label: 'Telegram' },
];

export function ProfileSocialsList() {
  const { t } = useTranslate('profile');

  const { socials } = useGetMySocials();

  const active = SOCIAL_META.filter((social) => socials[social.name]?.trim());

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{t('profile:socials.contactHeading')}</Typography>

      {active.length ? (
        <Stack direction="row" flexWrap="wrap" sx={{ gap: 2 }}>
          {active.map((social) => (
            <Tooltip key={social.name} title={social.label}>
              <Link
                href={socials[social.name]}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: 'inline-flex', color: 'text.primary' }}
              >
                <Iconify width={28} icon={social.icon} />
              </Link>
            </Tooltip>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('profile:socials.empty')}{' '}
          <Link component={RouterLink} href={`${paths.dashboard.profile}/socials`}>
            {t('profile:socials.emptyAction')}
          </Link>
        </Typography>
      )}
    </Stack>
  );
}
