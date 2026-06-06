'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import { getUserDisplay } from 'src/layouts/account/account-nav';
import { useGetMe, updateMyProfile, useGetMyProfile } from 'src/actions/account';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { LoadingScreen } from 'src/components/loading-screen';

import { ProfileCover } from 'src/sections/user/profile-cover';

// ----------------------------------------------------------------------

type ProfileSchemaType = z.infer<typeof ProfileSchema>;

const ProfileSchema = z.object({
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  patronymic: z.string().nullable(),
  country: z.string().nullable(),
});

const COVER_URL = `${CONFIG.assetsDir}/assets/background/background-6.webp`;

export function ProfileView() {
  const { t } = useTranslate(['profile', 'common']);

  const { me, meLoading } = useGetMe();
  const { profile, profileLoading } = useGetMyProfile();

  const methods = useForm<ProfileSchemaType>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { first_name: '', last_name: '', patronymic: '', country: '' },
    values: profile
      ? {
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? '',
          patronymic: profile.patronymic ?? '',
          country: profile.country ?? '',
        }
      : undefined,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateMyProfile({
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        patronymic: data.patronymic || null,
        country: data.country || null,
      });
      toast.success(t('profile:toast.profileUpdated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('profile:toast.profileUpdateFailed'));
    }
  });

  if (meLoading || profileLoading) return <LoadingScreen />;

  const { displayName } = getUserDisplay(me, profile);
  const primaryRole = me?.roles?.[0]?.role ?? '';

  return (
    <>
      <Card sx={{ mb: 3, height: 290 }}>
        <ProfileCover name={displayName} role={primaryRole} avatarUrl="" coverUrl={COVER_URL} />

        <Box
          sx={{
            width: 1,
            bottom: 0,
            zIndex: 9,
            gap: 1,
            px: { md: 3 },
            py: 2,
            display: 'flex',
            flexWrap: 'wrap',
            position: 'absolute',
            alignItems: 'center',
            bgcolor: 'background.paper',
            justifyContent: { xs: 'center', md: 'flex-end' },
          }}
        >
          <Label color={me?.is_email_verified ? 'success' : 'warning'}>
            {me?.is_email_verified ? t('profile:view.verified') : t('profile:view.notVerified')}
          </Label>
          {me?.roles?.map((r) => (
            <Label key={r.role} color="info">
              {r.role}
            </Label>
          ))}
        </Box>
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          {me?.email}
        </Typography>

        <Form methods={methods} onSubmit={onSubmit}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
            }}
          >
            <Field.Text name="first_name" label={t('profile:view.fields.firstName')} />
            <Field.Text name="last_name" label={t('profile:view.fields.lastName')} />
            <Field.Text name="patronymic" label={t('profile:view.fields.patronymic')} />
            <Field.Text name="country" label={t('profile:view.fields.country')} />
          </Box>

          <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
            <Button type="submit" variant="contained" loading={isSubmitting}>
              {t('profile:view.saveChanges')}
            </Button>
          </Stack>
        </Form>
      </Card>
    </>
  );
}
