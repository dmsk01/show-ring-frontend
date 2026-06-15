'use client';

import type { TFunction } from 'i18next';
import type { IUserSocials } from 'src/actions/account';
import type { IconifyName } from 'src/components/iconify';

import * as z from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import { accountErrorMessage } from 'src/actions/account-errors';
import { useGetMySocials, updateMySocials } from 'src/actions/account';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const SOCIAL_FIELDS: { name: keyof IUserSocials; icon: IconifyName; placeholder: string }[] = [
  { name: 'instagram', icon: 'socials:instagram', placeholder: 'https://instagram.com/...' },
  { name: 'facebook', icon: 'socials:facebook', placeholder: 'https://facebook.com/...' },
  { name: 'vk', icon: 'socials:vk', placeholder: 'https://vk.com/...' },
  { name: 'telegram', icon: 'socials:telegram', placeholder: 'https://t.me/...' },
];

// Бэкенд принимает только абсолютный http(s)-URL (иначе 422); пустая строка
// очищает ссылку. Зеркалим это: пусто валидно, иначе — абсолютный http(s)-URL.
function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getSocialsSchema(t: TFunction<['profile', 'common']>) {
  const link = z
    .string()
    .trim()
    .refine((val) => val === '' || isAbsoluteHttpUrl(val), {
      error: t('profile:validation.socialUrlInvalid'),
    });

  return z.object({
    instagram: link,
    facebook: link,
    vk: link,
    telegram: link,
  });
}

export type SocialsSchemaType = z.infer<ReturnType<typeof getSocialsSchema>>;

// ----------------------------------------------------------------------

export function ProfileSocialsForm() {
  const { t } = useTranslate(['profile', 'common']);

  const { socials, socialsLoading } = useGetMySocials();

  const SocialsSchema = useMemo(() => getSocialsSchema(t), [t]);

  const methods = useForm<SocialsSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(SocialsSchema),
    defaultValues: { instagram: '', facebook: '', vk: '', telegram: '' },
    values: socials,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateMySocials(data);
      toast.success(t('profile:toast.socialsUpdated'));
    } catch (error) {
      console.error(error);
      toast.error(accountErrorMessage(error));
    }
  });

  if (socialsLoading) return <LoadingScreen />;

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">{t('profile:socials.heading')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('profile:socials.description')}
          </Typography>

          {SOCIAL_FIELDS.map((social) => (
            <Field.Text
              key={social.name}
              name={social.name}
              label={t(`profile:socials.fields.${social.name}`)}
              placeholder={social.placeholder}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify width={24} icon={social.icon} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          ))}

          <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
            {t('profile:socials.submit')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
