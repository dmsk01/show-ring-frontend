'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';
import { useMyProfile, updateMyProfile } from 'src/actions/account';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProfileCover } from 'src/sections/user/profile-cover';

import { useAuthContext } from 'src/auth/hooks';

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
  const { user: me, loading: meLoading } = useAuthContext();
  const { profile, profileLoading } = useMyProfile();

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
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  });

  if (meLoading || profileLoading) return <LoadingScreen />;

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || me?.email || '';
  const primaryRole = me?.roles?.[0]?.role ?? '';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="My profile"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Profile' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

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
            {me?.is_email_verified ? 'Verified' : 'Not verified'}
          </Label>
          {(me?.roles as Array<{ role: string }> | undefined)?.map((r) => (
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
            <Field.Text name="first_name" label="First name" />
            <Field.Text name="last_name" label="Last name" />
            <Field.Text name="patronymic" label="Patronymic" />
            <Field.Text name="country" label="Country" />
          </Box>

          <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
            <Button type="submit" variant="contained" loading={isSubmitting}>
              Save changes
            </Button>
          </Stack>
        </Form>
      </Card>
    </DashboardContent>
  );
}
